export const AVERAGE_ITEM_PRICE_REQUESTED = "AVERAGE_ITEM_PRICE_REQUESTED";
export const QueryAverageItemPriceAction = (amount, itemId) => ({
    type: AVERAGE_ITEM_PRICE_REQUESTED,
    payload: {amount, itemId}
});
export const SEARCH_VALUE_CHANGED = "SEARCH_VALUE_CHANGED";
export const searchValueChangedAction = (itemNameTerm) => ({
    type: SEARCH_VALUE_CHANGED,
    payload: {term: itemNameTerm}
});
export const FETCH_ITEM_SUPPLY_REQUESTED = "FETCH_ITEM_SUPPLY_REQUESTED";
export const itemSupplyRequestAction = (itemNameTerm, itemCategory) => ({
    type: FETCH_ITEM_SUPPLY_REQUESTED,
    payload: {term: itemNameTerm, category: itemCategory}
});
export const FETCH_ITEM_SUPPLY_SUCCEEDED = "FETCH_ITEM_SUPPLY_SUCCEEDED";
export const itemSupplySucceededAction = (itemSupplies, amount) => ({
    type: FETCH_ITEM_SUPPLY_SUCCEEDED,
    payload: {itemSupplies, amount}
});