# TrendingTag


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**tag** | **str** |  | 
**count** | **int** |  | 

## Example

```python
from microblog_sdk.models.trending_tag import TrendingTag

# TODO update the JSON string below
json = "{}"
# create an instance of TrendingTag from a JSON string
trending_tag_instance = TrendingTag.from_json(json)
# print the JSON string representation of the object
print(TrendingTag.to_json())

# convert the object into a dict
trending_tag_dict = trending_tag_instance.to_dict()
# create an instance of TrendingTag from a dict
trending_tag_from_dict = TrendingTag.from_dict(trending_tag_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


