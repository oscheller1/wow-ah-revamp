/**
 * get a user by its name and realm
 * @param db
 * @param name
 * @param realm
 * @returns {Promise}
 */
function getUserByNameAndRealm(db, name, realm) {
    return new Promise((resolve, reject) => {
        const Users = db.collection('users');
        Users.findOne({name: `${name}-${realm}`},
            (err, user) => {
                if (err) reject(err);
                resolve(user)
            });
    });
}

/**
 * get an item object by its id
 * @param converter
 * @param db
 * @param itemId
 * @returns {Promise}
 */
function getItemById(converter, db, itemId) {
    return new Promise((resolve, reject) => {
        const Items = db.collection('items');

        // DB CALL
        Items.findOne({id: itemId},
            async (err, item) => {
                if (err) reject(err);
                if (item === null) resolve(null);
                const gqlItem = converter.ItemMongoToGql(item);
                resolve(gqlItem)
            }
        )
    });
}

/**
 * get an item object by its name
 * @param db
 * @param itemName
 * @returns {Promise}
 */
function getItemByName(db, itemName) {
    return new Promise((resolve, reject) => {
        const Items = db.collection('items');
        Items.findOne({name: itemName},
            async (err, item) => {
                if (err) reject(err);
                if (item === null) resolve(null);
                const itemClasses = await getItemClassById(db, item.item_class, item.item_sub_class);
                resolve({...item, ...itemClasses})
            }
        )
    });
}

function getItemNamesByPartialName(db, partialItemName, only_stackable = false) {
    return new Promise((resolve, reject) => {
        const Items = db.collection('items');
        const stackable = only_stackable ? {"is_stackable": true} : {};

        // DB CALL
        Items.find({'name': {'$regex': ".*" + partialItemName + ".*", '$options': 'i'}, ...stackable}).toArray(
            async (err, items) => {
                if (err) reject(err);
                if (items.length === 0) resolve(null);
                let itemNames = [];
                items.forEach(async item => {
                    itemNames.push(item.name);
                });
                resolve(itemNames);
            })
    });
}

function getItemsByPartialName(db, partialItemName) {
    return new Promise(async (resolve, reject) => {
        // console.log(1);
        const items = await getItemNamesByPartialName(db, partialItemName);
        let gqlItems = [];
        for (let itemName of items) {
            const gqlItem = await getItemByName(db, itemName);
            gqlItems.push(gqlItem)
        }
        resolve(gqlItems);
    })
}

function getItemsSupplyByPartialName(db, partialItemName) {
    return new Promise(async (resolve, reject) => {
        const items = await getItemNamesByPartialName(db, partialItemName);
        let gqlItemsSupply = [];
        for (let itemName of items) {
            const gqlItemSupply = await getItemSupplyByName(db, itemName);
            gqlItemsSupply.push(gqlItemSupply)
        }
        resolve(gqlItemsSupply);
    })
}

/**
 * Get a class by its id
 * @param db: database object
 * @param classId: id of the class
 * @param subClassId: id of the subclass, retrieved from the item
 * @returns {Promise}
 */
function getItemClassById(db, classId, subClassId) {
    return new Promise((resolve, reject) => {
        const ItemClasses = db.collection('itemclasses');
        ItemClasses.findOne({id: classId}, async (err, itemClass) => {
            if (err) reject(err);
            if (!itemClass) {
                resolve(null)
            }
            const itemSubClass = itemClass.subclasses.filter(i => i.id === subClassId)[0];
            let item_sub_class;
            const item_class = {name: itemClass.name, id: itemClass.id};
            if (itemSubClass) {
                item_sub_class = {name: itemSubClass.name, id: itemSubClass.id};
            }

            resolve({item_class, item_sub_class})
        });
    })
}

/**
 * Get the supply of a given item
 * @param db: database object
 * @param itemName: name of the item requested
 * @returns {Promise} item supply object
 */
function getItemSupplyByName(db, itemName) {
    return new Promise((resolve, reject) => {
        getItemByName(db, itemName).then((item) => {
            const SellOrders = db.collection('sellorders');
            SellOrders.find({item_id: item.id}).toArray((err, sellOrders) => {
                if (err) reject(err);
                if (sellOrders.length === 0) resolve(null);
                const quantity = sellOrders.reduce((acc, curr) => {
                    return acc + curr.quantity;
                }, 0);
                const prices = sellOrders.map(s => s.price);
                const min_price = Math.min(...prices);
                resolve({
                    id: item.id,
                    item: item,
                    quantity,
                    min_price
                })
            });
        });
    })
}


/// optimizations


function getItemsByPartialNameOPTIMIZED(converter, db, partialItemName, only_stackable = false) {
    return new Promise((resolve, reject) => {
        const Items = db.collection('items');
        const stackable = only_stackable ? {"is_stackable": true} : {};

        // DB CALL
        Items.find({'name': {'$regex': ".*" + partialItemName + ".*", '$options': 'i'}, ...stackable}).toArray(
            async (err, items) => {
                if (err) reject(err);
                if (items.length === 0) resolve(null);
                let gqlItems = [];
                items.forEach(async item => {
                    gqlItems.push(converter.ItemMongoToGql(item));
                });
                resolve(gqlItems);
            })
    });
}


function getItemSuppliesByPartialNameOPTIMIZED(converter, db, partialItemName) {
    return new Promise((resolve, reject) => {

        // Get all items macthing the itemName
        getItemsByPartialNameOPTIMIZED(converter, db, partialItemName).then(items => {
            if (items === null) {
                resolve([]);
                return 0
            }

            // Get all sell orders and aggregate them to item supply for each item
            const SellOrders = db.collection('sellorders');
            SellOrders.find({
                'item_name': {
                    '$regex': ".*" + partialItemName + ".*",
                    '$options': 'i'
                }
            }).sort({item_name: -1}).toArray((err, mongoSellOrders) => {
                    // allSellOrder is a list of lists of SellOrders for each item
                    let allSellOrders = [];
                    let currentItemStarted = false;

                    for (let item of items) {
                        let sellOrdersOfItem = [];
                        for (let mongoSellOrder of mongoSellOrders) {
                            if (mongoSellOrder.item_name === item.name) {
                                currentItemStarted = true;
                                sellOrdersOfItem.push({...mongoSellOrder, item});

                            } else {
                                if (currentItemStarted) {
                                    currentItemStarted = false;
                                    break;
                                }
                            }
                        }
                        if (sellOrdersOfItem.length > 0) {
                            allSellOrders.push([...sellOrdersOfItem])
                        }
                    }

                    // Now go over all sell orders and aggregate each list
                    let listOfItemSupplies = [];

                    for (let sellOrderList of allSellOrders) {

                        const itemId = sellOrderList[0].item_id;
                        const item = sellOrderList[0].item;
                        const quantity = sellOrderList.reduce((acc, curr) => {
                            return acc + curr.quantity;
                        }, 0);
                        const prices = sellOrderList.map(s => s.price);
                        const min_price = Math.min(...prices);
                        listOfItemSupplies.push({
                            id: itemId,
                            item: item,
                            quantity,
                            min_price
                        })
                    }
                    resolve(listOfItemSupplies);
                }
            )
        });
    })
}

//
// getItemByName(db, itemName).then((item) => {
//     const SellOrders = db.collection('sellorders');
//     SellOrders.find({item_id: item.id}).toArray((err, sellOrders) => {
//         if (err) reject(err);
//         if (sellOrders.length === 0) resolve(null);
//         const quantity = sellOrders.reduce((acc, curr) => {
//             return acc + curr.quantity;
//         }, 0);
//         const prices = sellOrders.map(s => s.price);
//         const min_price = Math.min(...prices);
//         resolve({
//             id: item.id,
//             item: item,
//             quantity,
//             min_price
//         })
//     });
// });


module.exports = {
    getItemsByPartialName,
    getItemClassById,
    getItemById,
    getUserByNameAndRealm,
    getItemSupplyByName,
    getItemsSupplyByPartialName,
    getItemSuppliesByPartialNameOPTIMIZED
};