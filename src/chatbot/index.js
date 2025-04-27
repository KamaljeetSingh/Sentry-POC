import React, { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import './styles.css';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/sentry-query'
  : 'http://localhost:5000/api/sentry-query';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h3>Something went wrong</h3>
          <p>Please try refreshing the page or contact support if the issue persists.</p>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}

const SentryChatbot = () => {
  const [messages, setMessages] = useState([
    { 
      sender: 'bot', 
      text: 'Hello! I can help you monitor your application. Ask me questions like:\n\n' +
            '• "What are the top errors from last week?"\n' +
            '• "Show me critical issues in the past 24 hours"\n' +
            '• "List unresolved errors sorted by frequency"\n' +
            '• "What are the most recent errors in the production environment?"'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatResponse = (text) => {
    if (!text) return '';
    
    try {
      // Add markdown-like formatting
      const formattedText = text
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br/>')
        .replace(/- (.*?)(?:\n|$)/g, '<li>$1</li>')
        .replace(/^\s*<li>/gm, '<ul><li>')
        .replace(/<\/li>\s*$/gm, '</li></ul>');

      // Sanitize the HTML
      return DOMPurify.sanitize(formattedText, {
        ALLOWED_TAGS: ['br', 'code', 'pre', 'strong', 'em', 'ul', 'li', 'p'],
        ALLOWED_ATTR: []
      });
    } catch (error) {
      console.error('Error formatting response:', error);
      return text;
    }
  };

  const handleSend = async () => {
    if (input.trim() === '') return;
    
    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: input }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.response) {
        throw new Error('Invalid response format from server');
      }
      
      const formattedResponse = formatResponse(data.response);
      
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: formattedResponse,
        isFormatted: true 
      }]);
    } catch (error) {
      console.error('Error in handleSend:', error);
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: 'Sorry, I encountered an error while processing your request. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <ErrorBoundary>
      <div className="sentry-chatbot">
        <div className="chatbot-header">
          <h2>Sentry Error Monitor</h2>
        </div>
        <div className="chatbot-messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.sender}`}>
              {message.isFormatted ? (
                <div 
                  className="message-content"
                  dangerouslySetInnerHTML={{ __html: message.text }}
                />
              ) : (
                <div className="message-content">
                  {message.text}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="message bot">
              <div className="message-content loading">
                <div className="dot-typing"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chatbot-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your application errors..."
            disabled={isLoading}
          />
          <button onClick={handleSend} disabled={isLoading || !input.trim()}>
            Send
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SentryChatbot;