# LikeResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**message** | **str** |  | 
**total_likes** | **int** |  | 

## Example

```python
from microblog_sdk.models.like_response import LikeResponse

# TODO update the JSON string below
json = "{}"
# create an instance of LikeResponse from a JSON string
like_response_instance = LikeResponse.from_json(json)
# print the JSON string representation of the object
print(LikeResponse.to_json())

# convert the object into a dict
like_response_dict = like_response_instance.to_dict()
# create an instance of LikeResponse from a dict
like_response_from_dict = LikeResponse.from_dict(like_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


