import React from "react";
import { css } from "@emotion/react";
import { SG } from "../helpers/SG";
import { useTranslate } from "../hooks/useTranslate";
import type { TemplateProps } from "../@types";

const box = css`
  padding: 24px 0;
  font-size: 24px;
  font-weight: bold;
`;

const Welcome: React.FC<TemplateProps> = ({ lang = "en" }) => {
  const { t } = useTranslate(lang);

  return (
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
      <tbody>
        <tr>
          <td align="center">
            <table
              width="600"
              role="presentation"
              cellPadding="0"
              cellSpacing="0"
            >
              <tbody>
                <tr>
                  <td css={box}>{t("welcome_title")}</td>
                </tr>
                <tr>
                  <td css={{ padding: "16px 0", fontSize: 16 }}>
                    {t("greeting")},{" "}
                    <strong>{<SG.Var name="first_name" />}</strong>!
                  </td>
                </tr>
                <tr>
                  <td css={{ padding: "16px 0", fontSize: 14 }}>
                    <SG.If cond="has_discount">
                      <p>{t("discount_line")}</p>
                    </SG.If>
                  </td>
                </tr>
                <tr>
                  <td css={{ padding: "24px 0", fontSize: 12, color: "#666" }}>
                    {t("footer")}
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default Welcome;
