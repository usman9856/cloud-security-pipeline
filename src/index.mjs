import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const ssm = new SSMClient({});

export const handler = async () => {
  const res = await ssm.send(
    new GetParameterCommand({
      Name: process.env.SECRET_PARAM_NAME,
      WithDecryption: true,
    })
  );

  // Never log or return the secret itself.
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: Boolean(res.Parameter?.Value) }),
  };
};
