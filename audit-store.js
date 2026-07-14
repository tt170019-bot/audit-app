(function(root, factory){
  root.AuditStore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  function open(name, version){
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, version);
      request.onupgradeneeded = event => {
        const database = event.target.result;
        if(!database.objectStoreNames.contains('templates')) database.createObjectStore('templates', {keyPath:'id', autoIncrement:true});
        if(!database.objectStoreNames.contains('audits')) database.createObjectStore('audits', {keyPath:'id', autoIncrement:true});
      };
      request.onsuccess = event => resolve(event.target.result);
      request.onerror = event => reject(event.target.error);
    });
  }

  function request(database, storeName, mode, operation){
    return new Promise((resolve, reject) => {
      const request = operation(database.transaction(storeName, mode).objectStore(storeName));
      request.onsuccess = () => resolve(request.result);
      request.onerror = event => reject(event.target.error);
    });
  }

  return {
    open,
    all: (database, store) => request(database, store, 'readonly', objectStore => objectStore.getAll()),
    get: (database, store, id) => request(database, store, 'readonly', objectStore => objectStore.get(id)),
    put: (database, store, value) => request(database, store, 'readwrite', objectStore => objectStore.put(value)),
    delete: (database, store, id) => request(database, store, 'readwrite', objectStore => objectStore.delete(id)),
    clear: (database, store) => request(database, store, 'readwrite', objectStore => objectStore.clear())
  };
});
