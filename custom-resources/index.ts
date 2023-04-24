// import { Context } from 'aws-lambda';

export const handler = async (event: any) => {
  console.log(JSON.stringify(event));

  return {
    statusCode: 200,
    body: JSON.stringify({
      event,
    })
  };
};
