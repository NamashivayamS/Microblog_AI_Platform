# LikeRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**user_name** | **str** |  | 

## Example

```python
from microblog_sdk.models.like_request import LikeRequest

# TODO update the JSON string below
json = "{}"
# create an instance of LikeRequest from a JSON string
like_request_instance = LikeRequest.from_json(json)
# print the JSON string representation of the object
print(LikeRequest.to_json())

# convert the object into a dict
like_request_dict = like_request_instance.to_dict()
# create an instance of LikeRequest from a dict
like_request_from_dict = LikeRequest.from_dict(like_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


