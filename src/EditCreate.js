import React, { useState, useEffect } from 'react';

const EditCreate = ({ item, onSave }) => {
  console.log("item", item);  
  const [name, setName] = useState(item ? item.name : '');

  useEffect(() => {
    if (item) {
      setName(item.name);
    }
  }, [item]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...item, name });
  };

  return (
    <div className="edit-create">
      <h2>{item ? 'Edit Item' : 'Create Item'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
          required
        />
        <button type="submit">Save</button>
      </form>
    </div>
  );
};

export default EditCreate; 