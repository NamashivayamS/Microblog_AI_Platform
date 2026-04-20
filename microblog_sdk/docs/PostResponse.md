# PostResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **int** |  | 
**content** | **str** |  | 
**user_name** | **str** |  | 
**created_at** | **datetime** |  | 
**likes_count** | **int** |  | 

## Example

```python
from microblog_sdk.models.post_response import PostResponse

# TODO update the JSON string below
json = "{}"
# create an instance of PostResponse from a JSON string
post_response_instance = PostResponse.from_json(json)
# print the JSON string representation of the object
print(PostResponse.to_json())

# convert the object into a dict
post_response_dict = post_response_instance.to_dict()
# create an instance of PostResponse from a dict
post_response_from_dict = PostResponse.from_dict(post_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


