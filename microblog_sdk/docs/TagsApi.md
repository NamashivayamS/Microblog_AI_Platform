# microblog_sdk.TagsApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**trending_tags_posts_trending_tags_get**](TagsApi.md#trending_tags_posts_trending_tags_get) | **GET** /posts/trending-tags | Get trending hashtags


# **trending_tags_posts_trending_tags_get**
> List[TrendingTag] trending_tags_posts_trending_tags_get(limit=limit)

Get trending hashtags

Returns the most used hashtags from the 100 most recent posts.

### Example


```python
import microblog_sdk
from microblog_sdk.models.trending_tag import TrendingTag
from microblog_sdk.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = microblog_sdk.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with microblog_sdk.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = microblog_sdk.TagsApi(api_client)
    limit = 10 # int |  (optional) (default to 10)

    try:
        # Get trending hashtags
        api_response = api_instance.trending_tags_posts_trending_tags_get(limit=limit)
        print("The response of TagsApi->trending_tags_posts_trending_tags_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling TagsApi->trending_tags_posts_trending_tags_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**|  | [optional] [default to 10]

### Return type

[**List[TrendingTag]**](TrendingTag.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

