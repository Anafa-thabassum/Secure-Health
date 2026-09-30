export const bearerToken = (authorization = "") => {
  const [scheme, token, extra] = authorization.trim().split(/\s+/);
  return scheme === "Bearer" && token && !extra ? token : null;
};

