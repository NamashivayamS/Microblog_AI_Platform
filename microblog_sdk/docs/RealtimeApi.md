# microblog_sdk.RealtimeApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**sse_stream_posts_stream_get**](RealtimeApi.md#sse_stream_posts_stream_get) | **GET** /posts/stream | Server-Sent Events stream


# **sse_stream_posts_stream_get**
> object sse_stream_posts_stream_get()

Server-Sent Events stream

A persistent SSE connection. The server pushes a 'refresh' event when posts or likes change. Clients use this instead of polling.

### Example


```python
import microblog_sdk
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
    api_instance = microblog_sdk.RealtimeApi(api_client)

    try:
        # Server-Sent Events stream
        api_response = api_instance.sse_stream_posts_stream_get()
        print("The response of RealtimeApi->sse_stream_posts_stream_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling RealtimeApi->sse_stream_posts_stream_get: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

