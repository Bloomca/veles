## Testing philosophy

This library is fully tested by using integration tests, meaning that nothing is mocked (except DOM itself), and every feature is tested by mounting the whole application and executing each scenario.

There are some benefits and drawbacks in this approach. The main advantage is that we can test this library as a whole, and the main drawback is that if something fails, it doesn't mean that the tested part has some introduced issues.

There is significant overlap in scenarios to the point where some test can have different assertions but very similar setup code. At the end of the day, the more potential situations are covered, even in a similar manner, the better for a general UI library.

In the future, if some microoptimizations will be employed for some specific algorithms, it might be worth it to include unit tests for that as well.