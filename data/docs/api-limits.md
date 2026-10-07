# API rate limits

Every API key has a rate limit that depends on the plan of the project it belongs to. Limits are counted per project, not per user.

## What happens when you hit the limit

Requests over the limit get HTTP status 429 Too Many Requests. The response includes a Retry-After header with the number of seconds to wait. Limits reset every minute (every day on the Free plan).

## Raising your limit

Team customers can ask support for a temporary limit increase for events like product launches. Requests must be made at least 5 business days in advance.
