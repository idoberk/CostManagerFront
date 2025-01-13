const costManagerUtils = {};

costManagerUtils.Database = class {
	constructor(dbName = 'costmanagerdb', dbVersion = 1) {
		this.dbName = dbName;
		this.dbVersion = dbVersion;
		this.db = null;
	}

	initDatabase() {
		return new Promise((res, rej) => {
			const dbRequest = indexedDB.open(this.dbName, this.dbVersion);

			dbRequest.onerror = () => {
				rej(new Error('Failed to connect to database'));
			};

			dbRequest.onsuccess = (event) => {
				this.db = event.target.result;
				res(this.db);
			};

			dbRequest.onupgradeneeded = (event) => {
				const database = event.target.result;

				if (!database.objectStoreNames.contains('costs')) {
					const costStore = database.createObjectStore('costs', {
						keyPath: 'id',
						autoIncrement: true
					});
					
					costStore.createIndex('dateIndex', 'date');
					costStore.createIndex('categoryIndex', 'category');
				}
			};
		});
	}
}