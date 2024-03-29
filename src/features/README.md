# Solace JavaScript API advanced samples

This directory contains code showing how to make use of advanced features of the Solace PubSub+ Event Broker.

The code requires JavaScript API version 10 or later.

For quick start instructions, refer to the [Getting Started README](https://github.com/SolaceSamples/solace-samples-javascript/blob/master/README.md)

For an introduction to the JavaScript API and associated tutorials, check out the [tutorials home page](https://solacesamples.github.io/solace-samples-javascript/).

To learn more about specific features and details, refer to the [Solace developer guide]( https://docs.solace.com/Solace-Messaging-APIs/Developer-Guide/Developer-Guide-Home.htm)

## Description and instructions

* __SecureSession__: This sample will show the use of secure connection to the server. The web application user may need to select or cancel selection of a client certificate to use in a popup window - triggered by an invisible iframe connecting securely to the server. This is necessary because the message router is always requesting a client certificate.

* __ActiveFlowIndication__: This sample will show how multiple flows can bind to an exclusive queue, but only one client at a time can actively receive messages. If the Active Flow Indication Flow property is enabled, a Flow active/inactive event is returned to the client when its bound flow becomes/stops being the active flow. Start this app, then the `basic-samples/ConfirmedPublish` app can be used to send 10 messages to trigger it.

    *Prerequisite*: this sample requires that the queue "tutorial/queue" exists on the message router and configured to be "exclusive".  Ensure the queue is enabled for both Incoming and Outgoing messages and set the Permission to at least 'Consume'.

* __DTEConsumer__: This sample shows how to consume messages from a Durable Topic Endpoint (DTE). The sample will associate the DTE with the topic "tutorial/topic", so the `basic-samples/TopicPublisher` app can be used to send messages to this topic.

    *Prerequisite*: the DTE with the name "tutorial/dte" must have been provisioned on the Solace PubSub+ Event Broker.  Ensure the DTE is enabled for both Incoming and Outgoing messages and set the Permission to at least 'Consume'.

* __EventMonitor__: This sample demonstrates how to use the special event monitoring topic subscriptions to build an application that monitors message router generated events. Start this sample then run any other sample app and observe a client connect event reported for that sample.

    *Prerequisite*: configure the vpn on the message router to "Publish Client Event Messages".

* __GuaranteedRequestor/Replier__: This sample will show the implementation of guaranteed Request-Reply messaging, where `GuaranteedRequestor` is a message Endpoint that sends a guaranteed request message to a request topic and waits to receive a reply message on a dedicated temporary queue as a response; `GuaranteedReplier` is a message Endpoint that waits to receive a request message on a request topic - it will create a non-durable topic endpoint for that - and responds to it by sending a guaranteed reply message. Start the replier first as the non-durable topic endpoint will only be created for the duration of the replier session and any request sent before that will not be received.

* __NoLocalPubSub__: This sample will show the use of the NO_LOCAL Session and Flow properties. With these properties enabled, messages published on a Session cannot be received on that same session or on a Flow on that Session even when there is a matching subscription. This sample will create and use a temporary queue.

* __MessageReplay__: This sample will show how a client can initiate and process the replay of previously published messages, as well as deal with an externally initiated replay.

    *Prerequisite*: this sample requires that the queue "tutorial/queue" exists on the message router and configured to be "exclusive".  Ensure the queue is enabled for both Incoming and Outgoing messages and set the Permission to at least 'Consume'.
