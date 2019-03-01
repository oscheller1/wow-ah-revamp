-- Do not manually edit this file, it was auto-generated by dillonkearns/elm-graphql
-- https://github.com/dillonkearns/elm-graphql


module Gqllib.Object.ItemClass exposing (id, name, subclasses)

import Gqllib.InputObject
import Gqllib.Interface
import Gqllib.Object
import Gqllib.Scalar
import Gqllib.ScalarCodecs
import Gqllib.Union
import Graphql.Internal.Builder.Argument as Argument exposing (Argument)
import Graphql.Internal.Builder.Object as Object
import Graphql.Internal.Encode as Encode exposing (Value)
import Graphql.Operation exposing (RootMutation, RootQuery, RootSubscription)
import Graphql.OptionalArgument exposing (OptionalArgument(..))
import Graphql.SelectionSet exposing (SelectionSet)
import Json.Decode as Decode


{-| -}
id : SelectionSet Float Gqllib.Object.ItemClass
id =
    Object.selectionForField "Float" "id" [] Decode.float


{-| -}
name : SelectionSet (Maybe String) Gqllib.Object.ItemClass
name =
    Object.selectionForField "(Maybe String)" "name" [] (Decode.string |> Decode.nullable)


{-| -}
subclasses : SelectionSet decodesTo Gqllib.Object.SubClass -> SelectionSet (Maybe (List (Maybe decodesTo))) Gqllib.Object.ItemClass
subclasses object_ =
    Object.selectionForCompositeField "subclasses" [] object_ (identity >> Decode.nullable >> Decode.list >> Decode.nullable)
