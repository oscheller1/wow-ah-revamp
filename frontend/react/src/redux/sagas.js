import {all, call, put, takeEvery, takeLatest} from 'redux-saga/effects'

import {dummyApiCall, downloadItemsSupplyByPartialName} from "../api/graphql_api";

import {itemSupplySucceededAction} from "./actions/itemActions";

function* watchFetchItemSupply() {
    yield takeLatest('FETCH_ITEM_SUPPLY_REQUESTED', fetchItemsSupplyByPartialName)
}

export function* fetchItemSupply(action) {
    try {
        const data = yield call(dummyApiCall, action.payload.term);
        yield put(itemSupplySucceededAction(data))
    } catch (error) {
        yield put({type: "FETCH_ITEM_SUPPLY_FAILED", error})
    }
}
export function* fetchItemsSupplyByPartialName(action) {
    if (action.payload.term.length < 4)
        return {};
    try {
        const data = yield call(downloadItemsSupplyByPartialName, action.payload.term);
        console.log(data)
        yield put(itemSupplySucceededAction(data))
    } catch (error) {
        yield put({type: "FETCH_ITEM_SUPPLY_FAILED", error})
    }
}

export default function* rootSaga() {
    yield all([
        watchFetchItemSupply()
    ])
}
