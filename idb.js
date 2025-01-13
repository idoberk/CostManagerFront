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

	addCostItem(costData) {
		return new Promise((res, rej) => {
			const transaction = this.db.transaction(['costs'], 'readwrite');
			const store = transaction.objectStore('costs');
			const addRequest = store.add(costData);

			addRequest.onsuccess = () => res(addRequest.result);
			addRequest.onerror = () => rej(new Error('Failed to add cost item'));
		});
	}

	getMonthlyCosts(month, year) {
		return new Promise((res, rej) => {
			const transaction = this.db.transaction(['costs'], 'readonly');
			const store = transaction.objectStore('costs');
			const costs = [];
			const cursorRequest = store.openCursor();

			cursorRequest.onsuccess = (event) => {
				const cursor = event.target.result;

				if (cursor) {
					const item = cursor.value;
					const itemDate = new Date(item.date);

					if (itemDate.getFullYear() === year && itemDate.getMonth() === month - 1) {
						costs.push(item);
					}
					cursor.continue();
				} else {
					res(costs);
				}
			};

			cursorRequest.onerror = () => rej(new Error('Failed to get costs'));
		});
	}

	getCategoryTotals(month, year) {
		return new Promise((res, rej) => {
			this.getMonthlyCosts(month, year)
				.then(costs => {
					const totals = {};
					costs.forEach((cost) => {
						totals[cost.category] = (totals[cost.category] || 0) + cost.amount;
					});
					res(totals);
				}).catch(() => rej(new Error('Failed to get category totals')));
		});
	}
};

export default costManagerUtils;