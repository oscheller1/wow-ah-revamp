port module Main exposing (createSubscriptions, initialModel, main, update, view)

import Action exposing (Msg(..))
import Browser
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events as Evt exposing (keyCode, on, onClick, onInput)
import Json.Decode as Json
import Json.Encode as E
import Maybe exposing (..)
import Mutations exposing (buyMutation, makeMutation)
import Page.Buy as Buy exposing (..)
import Queries exposing (itemPriceQuery, itemQuery, itemSupplyQuery, makeRequest)
import State exposing (DataState, FakeItem, Item, ItemSupply, Price, Route(..), State, UiState)
import String exposing (..)


fakeItem : String -> Int -> FakeItem
fakeItem n a =
    { name = n, amount = a }


initialUiState : UiState
initialUiState =
    { route = SELL }


initialItem : Item
initialItem =
    { name = "default"
    , id = "0"
    , icon = Just "none"
    }


initialItemSupplies =
    Maybe.Just [ Nothing ]


initialDataState : DataState
initialDataState =
    { item = initialItem
    , itemSupplies = initialItemSupplies
    , searchValue = ""
    , itemPriceMappings = []
    , itemAmountMappings = []
    }


initialModel : () -> ( State, Cmd Msg )
initialModel _ =
    ( { ui = initialUiState
      , data = initialDataState
      }
    , Cmd.none
    )


port createSubscriptions : E.Value -> Cmd msg


update : Msg -> State -> ( State, Cmd Msg )
update msg model =
    case msg of
        SetCurrentRoute newRoute ->
            ( { model | ui = { route = newRoute } }, Cmd.none )

        GotItemResponse response ->
            case response of
                Ok value ->
                    let
                        oldData =
                            model.data

                        newData =
                            { oldData | item = withDefault initialItem value }
                    in
                    ( { model | data = newData }, Cmd.none )

                Err value ->
                    ( model, Cmd.none )

        GotItemSupplyResponse response ->
            case response of
                Ok value ->
                    let
                        oldData =
                            model.data

                        newData =
                            { oldData | itemSupplies = value }
                    in
                    ( { model | data = newData }, Cmd.none )

                Err value ->
                    ( model, Cmd.none )

        EnterSearchValue value ->
            let
                oldData =
                    model.data

                newData =
                    { oldData | searchValue = value }
            in
            ( { model | data = newData }, Cmd.none )

        SearchItemSupplies ->
            let
                searchValue =
                    model.data.searchValue
            in
            ( model, makeRequest (itemSupplyQuery searchValue) GotItemSupplyResponse )

        EnterQuantity itemId quantity ->
            let
                itemAmountMapping =
                    { itemId = itemId, amount = quantity }

                oldData =
                    model.data

                oldItemAmountMappings =
                    oldData.itemAmountMappings

                newItemAmountMappings =
                    itemAmountMapping :: List.filter (\i -> i.itemId /= itemId) oldItemAmountMappings

                newData =
                    { oldData | itemAmountMappings = newItemAmountMappings }
            in
            ( { model | data = newData }, makeRequest (itemPriceQuery (withDefault 0 (String.toFloat itemId)) (withDefault 0 (String.toInt quantity))) (GotItemPriceResponse itemId) )

        GotItemPriceResponse itemId response ->
            case response of
                Ok val ->
                    case val of
                        Just value ->
                            let
                                oldData =
                                    model.data

                                oldItemPriceMappings =
                                    oldData.itemPriceMappings

                                --List ItemPriceMapping
                                itemPriceMapping =
                                    { itemId = itemId, price = value }

                                newItemPriceMappings =
                                    itemPriceMapping :: List.filter (\i -> i.itemId /= itemId) oldItemPriceMappings

                                newData =
                                    { oldData | itemPriceMappings = newItemPriceMappings }
                            in
                            ( { model | data = newData }, Cmd.none )

                        Nothing ->
                            ( model, Cmd.none )

                Err value ->
                    ( model, Cmd.none )

        BuyItem userName itemId amount total perUnit ->
            let
                oldData =
                    model.data

                oldItemAmountMappings =
                    oldData.itemAmountMappings

                oldItemPriceMappings =
                    oldData.itemPriceMappings

                newItemPriceMappings =
                    List.filter (\i -> i.itemId /= String.fromInt itemId) oldItemPriceMappings

                newItemAmountMappings =
                    List.filter (\i -> i.itemId /= String.fromInt itemId) oldItemAmountMappings

                newData =
                    { oldData | itemAmountMappings = newItemAmountMappings, itemPriceMappings = newItemPriceMappings }
            in
            ( { model | data = newData }, makeMutation (buyMutation userName itemId amount total perUnit) GotBuyItemResponse )

        GotBuyItemResponse response ->
            case response of
                Ok value ->
                    let
                        searchValue =
                            model.data.searchValue
                    in
                    ( model, makeRequest (itemSupplyQuery searchValue) GotItemSupplyResponse )

                Err error ->
                    ( model, Cmd.none )


getActiveClass : Route -> Route -> String
getActiveClass activeRoute route =
    if activeRoute == route then
        "item yellow active"

    else
        "item  yellow"


renderNav : State -> Html.Html Msg
renderNav model =
    Html.div []
        [ Html.div [ class "ui inverted left floated header" ] [ Html.text "WOW-AH-revamp" ]
        , Html.div [ class "ui inverted right floated secondary pointing menu" ]
            [ Html.a [ class (getActiveClass model.ui.route BUY), onClick (SetCurrentRoute BUY) ] [ Html.text "Buy" ]
            , Html.a [ class (getActiveClass model.ui.route SELL), onClick (SetCurrentRoute SELL) ] [ Html.text "Sell" ]
            ]
        ]


renderPage : State -> Html.Html Msg
renderPage model =
    case model.ui.route of
        SELL ->
            Html.div [] [ Html.text "home" ]

        BUY ->
            Buy.buyPage model


view : State -> Html.Html Msg
view model =
    Html.div [ class "ui inverted segment" ]
        [ renderNav model
        , Html.div [ class "ui clearing divider" ] []
        , renderPage model
        ]


subscriptions _ =
    Sub.none


main =
    Browser.element
        { init = initialModel
        , update = update
        , view = view
        , subscriptions = subscriptions
        }
