# CommentResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **int** |  | 
**post_id** | **int** |  | 
**content** | **str** |  | 
**user_name** | **str** |  | 
**author_name** | **str** |  | [optional] 
**created_at** | **datetime** |  | 

## Example

```python
from microblog_sdk.models.comment_response import CommentResponse

# TODO update the JSON string below
json = "{}"
# create an instance of CommentResponse from a JSON string
comment_response_instance = CommentResponse.from_json(json)
# print the JSON string representation of the object
print(CommentResponse.to_json())

# convert the object into a dict
comment_response_dict = comment_response_instance.to_dict()
# create an instance of CommentResponse from a dict
comment_response_from_dict = CommentResponse.from_dict(comment_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


