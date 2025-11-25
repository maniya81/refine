import { AuthPage, ThemedTitle as ThemedTitleV2 } from "@refinedev/antd";

import { authCredentials } from "@/providers";

export const LoginPage = () => {
  return (
    <>
      <AuthPage
        type="login"
        registerLink={false}
        forgotPasswordLink={false}
        title={
          <ThemedTitleV2
            collapsed={false}
            text={
              <span
                style={{
                  fontSize: "20px",
                  paddingTop: "14px",
                  display: "inline-block",
                }}
              >
                Ocean CRM
              </span>
            }
            icon={
              <img
                src="/assets/logo.png"
                alt="Ocean CRM Logo"
                style={{ height: "30px", width: "30px", objectFit: "contain" }}
              />
            }
          />
        }
        formProps={{
          initialValues: authCredentials,
        }}
      />
    </>
  );
};
