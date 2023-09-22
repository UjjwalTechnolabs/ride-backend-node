const { Kafka } = require("kafkajs");
const kafkaBrokerAddress = process.env.KAFKA_BROKER || "localhost:9092";

const kafka = new Kafka({
  clientId: "ride-service",
  brokers: [kafkaBrokerAddress],
});

const producer = kafka.producer();

const connectProducer = async () => {
  await producer.connect();
};

const consumer = kafka.consumer({
  groupId: "ride-service-group",
  sessionTimeout: 30000,
  heartbeatInterval: 10000,
});
const notifyAllDriversViaKafka = async (drivers, payload) => {
  console.log("Producing message to Kafka topic ride-requests:", "rideDetails");

  const extendedPayload = { ...payload, drivers };
  const message = {
    key: "rideRequest",
    value: JSON.stringify(extendedPayload),
  };
  await producer.send({ topic: "ride-request", messages: [message] });
};
const initializeConsumer = async (topicName, handler) => {
  try {
    console.log(`Connecting consumer for topic: ${topicName}`);
    await consumer.connect();
    console.log(`Consumer connected. Subscribing to topic: ${topicName}`);
    await consumer.subscribe({ topic: topicName, fromBeginning: true });
    consumer.run({
      eachMessage: handler,
    });
  } catch (error) {
    console.error(`Error initializing consumer for topic ${topicName}:`, error);
  }
};

module.exports = {
  connectProducer,
  initializeConsumer,
  notifyAllDriversViaKafka,
  producer,
};
