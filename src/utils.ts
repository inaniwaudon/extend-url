export type Result<T, U> =
  | {
      status: "success";
      result: T;
    }
  | {
      status: "error";
      errorType: U;
    };
