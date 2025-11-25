import React from "react";

import { ThemedLayout, ThemedTitle as ThemedTitleV2 } from "@refinedev/antd";

import { Header } from "./header";

export const Layout = ({ children }: React.PropsWithChildren) => {
  return (
    <>
      <ThemedLayout
        Header={Header}
        Title={(titleProps) => {
          return (
            <ThemedTitleV2
              {...titleProps}
              text={
                <span
                  style={{
                    fontSize: "18px",
                    paddingTop: "10px",
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
                  style={{
                    height: "30px",
                    width: "30px",
                    objectFit: "contain",
                  }}
                />
              }
            />
          );
        }}
      >
        {children}
      </ThemedLayout>
    </>
  );
};
