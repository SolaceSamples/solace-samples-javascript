# Getting Started Examples

## Solace JavaScript API

The "Getting Started" tutorials will get you up to speed and sending messages with Solace technology as quickly as possible. There are three ways you can get started:

- Follow [these instructions](https://cloud.solace.com/learn/group_getting_started/ggs_signup.html) to quickly spin up a cloud-based Solace messaging service for your applications.
- Follow [these instructions](https://docs.solace.com/Solace-SW-Broker-Set-Up/Setting-Up-SW-Brokers.htm) to start the Solace PubSub+ software event broker in leading Clouds, Container Platforms or Hypervisors. The tutorials outline where to download and how to install the Solace PubSub+ software event broker.
- If your company has Solace PubSub+ Event Brokers deployed, contact your middleware team to obtain the host name or IP address of a Solace PubSub+ Event Broker to test against, a username and password to access it, and a VPN in which you can produce and consume messages.

## Contents

This repository contains:

* Code and matching tutorial walk throughs for five different **basic** Solace messaging patterns. For a nice introduction to the Solace API and associated tutorials, check out the [tutorials home page](https://tutorials.solace.dev/javascript).

    See the individual tutorials for details:

    - [Publish/Subscribe](https://tutorials.solace.dev/javascript/publish-subscribe/): Learn how to set up pub/sub messaging on a Solace PubSub+ software event broker.
    - [Persistence](https://tutorials.solace.dev/javascript/persistence-with-queues/): Learn how to set up persistence for guaranteed delivery.
    - [Request/Reply](https://tutorials.solace.dev/javascript/request-reply/): Learn how to set up request/reply messaging.
    - [Confirmed Delivery](https://tutorials.solace.dev/javascript/confirmed-delivery/): Learn how to confirm that your messages are received by a Solace PubSub+ Event Broker.
    - [Topic to Queue Mapping](https://tutorials.solace.dev/javascript/topic-to-queue-mapping/): Learn how to map existing topics to Solace queues.

* The following additional samples showing how to make use of advanced features of the Solace PubSub+ Event Broker.

    - [Secure Session](https://github.com/SolaceSamples/solace-samples-javascript/tree/master/src/features/SecureSession): Learn how to use secure connection to the server and server and client certificate authentication.
    - [Active Consumer Indication](https://tutorials.solace.dev/javascript/active-consumer-indication/): Learn how multiple consumers can bind to an exclusive queue, but only one client at a time can actively receive messages.
    - [Durable Topic Endpoint Consumer](https://tutorials.solace.dev/javascript/dte-consumer/): Learn how to consume messages from a Durable Topic Endpoint (DTE).
    - [Event Monitor](https://github.com/SolaceSamples/solace-samples-javascript/tree/master/src/features/EventMonitor): Learn how to monitor message router generated events.
    - [GuaranteedRequestor](https://github.com/SolaceSamples/solace-samples-javascript/tree/master/src/features/GuaranteedRequestor)/[Replier](https://github.com/SolaceSamples/solace-samples-javascript/tree/master/src/features/GuaranteedRequestor): Learn how to set up guaranteed request/reply messaging.
    - [NoLocal Pub-Sub](https://github.com/SolaceSamples/solace-samples-javascript/tree/master/src/features/NoLocalPubSub): Learn how to prevent messages published on a session or consumer received on that same session or consumer.
    - [Message Replay](https://tutorials.solace.dev/javascript/message-replay/): Learn how to initiate and process the replay of previously published messages, as well as deal with an externally initiated replay.

## Checking out

To check out the project, clone this GitHub repository:

```
git clone https://github.com/SolaceSamples/solace-samples-javascript
cd solace-samples-javascript
```

Note: the code in the `master` branch of this repository depends on Solace JavaScript API version 10 or later. If you want to work with an older version clone the branch that corresponds your version.

### Download the Solace JavaScript API

These samples depend on version 10 or later of the Solace JavaScript API library.

The Solace JavaScript API (Browser) library can be [downloaded here](https://solace.com/downloads/).  The instructions in this tutorial assume you have downloaded the Web Messaging API for JavaScript library and unpacked it to a known location. The samples assume a  `lib` directory containing the API libraries will be installed in the current `solace-samples-javascript` directory at the root of the cloned repo:

```bash
cp -R <path_to_unzipped_API_distribution_package>/lib .
```

## Running the Samples

The samples are found in the `src/basic-samples` and `src/features` directories. Each sample is in it's own subdirectory. Within each sample subdirectory there is an html file which you load to launch the sample.

For example the `TopicPublisher` is found here:
    src/basic-samples/TopicPublisher

And it is launched by running the following in your browser:

    TopicPublisher.html

See the [tutorials](https://tutorials.solace.dev/javascript) for more details.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

See the list of [contributors](https://github.com/SolaceSamples/solace-samples-javascript/contributors) who participated in this project.

## License

This project is licensed under the Apache License, Version 2.0. - See the [LICENSE](LICENSE) file for details.

## Resources

For more information try these resources:

- The Solace Developer Portal website at: http://dev.solace.com
- Get a better understanding of [Solace technology](https://solace.com/products/tech/).
- Check out the [Solace blog](http://dev.solace.com/blog/) for other interesting discussions around Solace technology
- Ask the [Solace community.](https://solace.community)
