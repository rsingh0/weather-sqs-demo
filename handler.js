"use strict";
const SQS = require("aws-sdk/clients/sqs");
const axios = require("axios");
const sqs = new SQS();
const WEATHER_ENQUEUE_NAME = process.env.WeatherEnqueueName;

module.exports.weatherenqueue = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    console.log(event.queryStringParameters);
    if (event.queryStringParameters) {
      const params = {
        MessageBody: JSON.stringify(event.queryStringParameters),
        QueueUrl: WEATHER_ENQUEUE_NAME,
      };
      const result = await sqs.sendMessage(params).promise();
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(result),
      });
    }
  } catch (e) {
    console.log(e);
    callback(null, {
      statusCode: 500,
      body: JSON.stringify("Request failed"),
    });
  }
};

module.exports.weatherdequeue = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log('Response from weatherenqueue', event.Records);
  const location = JSON.parse(event.Records[0].body);
  console.log(location.city);
  if (location.city && location.city.length) {
    const response = await axios.get(
      `http://api.openweathermap.org/data/2.5/weather?q=${location.city}&units=metric&APPID=08e3ad0437282f0abefa56ee74ab56af`
    );
    const answer = `Temperature - ${response.data.main.temp}°C. Humidity - ${response.data.main.humidity}%. ${response.data.weather[0].description} is expected`;
    console.log(answer);
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(answer),
    });
  } else {
    throw new Error("Undefined inputs...");
  }
};
