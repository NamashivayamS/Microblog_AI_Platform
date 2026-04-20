# microblog_sdk.PostsApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**create_post_posts_post**](PostsApi.md#create_post_posts_post) | **POST** /posts/ | Create a new post
[**get_posts_posts_get**](PostsApi.md#get_posts_posts_get) | **GET** /posts/ | Get all posts
[**like_post_posts_post_id_like_post**](PostsApi.md#like_post_posts_post_id_like_post) | **POST** /posts/{post_id}/like | Like a post
[**trending_tags_posts_trending_tags_get**](PostsApi.md#trending_tags_posts_trending_tags_get) | **GET** /posts/trending-tags | Get trending hashtags


# **create_post_posts_post**
> PostResponse create_post_posts_post(post_create)

Create a new post

Create a new microblog post. Content must be 1–280 characters. Any #hashtags in the content are automatically parsed and indexed.

### Example


```python
import microblog_sdk
from microblog_sdk.models.post_create import PostCreate
from microblog_sdk.models.post_response import PostResponse
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
    api_instance = microblog_sdk.PostsApi(api_client)
    post_create = microblog_sdk.PostCreate() # PostCreate | 

    try:
        # Create a new post
        api_response = api_instance.create_post_posts_post(post_create)
        print("The response of PostsApi->create_post_posts_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling PostsApi->create_post_posts_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **post_create** | [**PostCreate**](PostCreate.md)|  | 

### Return type

[**PostResponse**](PostResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_posts_posts_get**
> List[PostResponse] get_posts_posts_get(skip=skip, limit=limit, tag=tag, search=search)

Get all posts

Retrieve posts ordered newest-first. Optionally filter by #hashtag via ?tag=

### Example


```python
import microblog_sdk
from microblog_sdk.models.post_response import PostResponse
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
    api_instance = microblog_sdk.PostsApi(api_client)
    skip = 0 # int |  (optional) (default to 0)
    limit = 100 # int |  (optional) (default to 100)
    tag = 'tag_example' # str | Filter by hashtag (e.g. FastAPI) (optional)
    search = 'search_example' # str | Search posts by content or username (optional)

    try:
        # Get all posts
        api_response = api_instance.get_posts_posts_get(skip=skip, limit=limit, tag=tag, search=search)
        print("The response of PostsApi->get_posts_posts_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling PostsApi->get_posts_posts_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **skip** | **int**|  | [optional] [default to 0]
 **limit** | **int**|  | [optional] [default to 100]
 **tag** | **str**| Filter by hashtag (e.g. FastAPI) | [optional] 
 **search** | **str**| Search posts by content or username | [optional] 

### Return type

[**List[PostResponse]**](PostResponse.md)

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

# **like_post_posts_post_id_like_post**
> LikeResponse like_post_posts_post_id_like_post(post_id, like_request)

Like a post

Like a post. Each user can only like a post once. Returns 409 on duplicate.

### Example


```python
import microblog_sdk
from microblog_sdk.models.like_request import LikeRequest
from microblog_sdk.models.like_response import LikeResponse
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
    api_instance = microblog_sdk.PostsApi(api_client)
    post_id = 56 # int | 
    like_request = microblog_sdk.LikeRequest() # LikeRequest | 

    try:
        # Like a post
        api_response = api_instance.like_post_posts_post_id_like_post(post_id, like_request)
        print("The response of PostsApi->like_post_posts_post_id_like_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling PostsApi->like_post_posts_post_id_like_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **post_id** | **int**|  | 
 **like_request** | [**LikeRequest**](LikeRequest.md)|  | 

### Return type

[**LikeResponse**](LikeResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

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
    api_instance = microblog_sdk.PostsApi(api_client)
    limit = 10 # int |  (optional) (default to 10)

    try:
        # Get trending hashtags
        api_response = api_instance.trending_tags_posts_trending_tags_get(limit=limit)
        print("The response of PostsApi->trending_tags_posts_trending_tags_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling PostsApi->trending_tags_posts_trending_tags_get: %s\n" % e)
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

