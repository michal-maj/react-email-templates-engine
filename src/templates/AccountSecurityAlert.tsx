import React from "react";
import { css } from "@emotion/react";
import type { TemplateProps } from "../@types";
import { useTranslate } from "../hooks/useTranslate";
import { SG } from "../helpers/SG";

const wrap = css`
  width: 600px;
`;
const h1 = css`
  padding: 24px 0 8px;
  font-size: 22px;
  font-weight: 700;
`;
const p = css`
  font-size: 14px;
  line-height: 1.5;
  padding: 6px 0;
`;
const btn = css`
  display: inline-block;
  text-decoration: none;
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 4px;
  background: #1a73e8;
  color: #ffffff !important;
`;
const muted = css`
  font-size: 12px;
  color: #666;
  padding-top: 16px;
`;

const AccountSecurityAlert: React.FC<TemplateProps> = ({ lang = "pl" }) => {
  const { t } = useTranslate(lang);

  return (
    <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
      <tbody>
        <tr>
          <td align="center">
            <table
              role="presentation"
              css={wrap}
              cellPadding={0}
              cellSpacing={0}
            >
              <tbody>
                <tr>
                  <td css={h1}>{t("title")}</td>
                </tr>

                <tr>
                  <td css={p}>
                    {t("hello")} <strong>{<SG.Var name="first_name" />}</strong>
                    ,
                  </td>
                </tr>

                <tr>
                  <td css={p}>
                    {t("intro")} <strong>{<SG.Var name="device" />}</strong>{" "}
                    {t("from_ip")} <strong>{<SG.Var name="ip" />}</strong>{" "}
                    {t("at")} <strong>{<SG.Var name="time" />}</strong>.
                  </td>
                </tr>

                <tr>
                  <td css={p}>{t("action_prompt")}</td>
                </tr>

                <tr>
                  <td style={{ padding: "14px 0" }}>
                    <a
                      href={"{{review_url}}"}
                      css={btn}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("review_button")}
                    </a>
                  </td>
                </tr>

                <tr>
                  <td css={p}>
                    <SG.If cond="show_details">
                      <table
                        width="100%"
                        role="presentation"
                        cellPadding={0}
                        cellSpacing={0}
                        style={{ marginTop: 6, borderCollapse: "collapse" }}
                      >
                        <tbody>
                          <tr>
                            <td style={{ padding: "6px 0", fontSize: 13 }}>
                              <strong>{t("details_device")}</strong>:{" "}
                              {<SG.Var name="device" />}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: "6px 0", fontSize: 13 }}>
                              <strong>{t("details_location")}</strong>:{" "}
                              {<SG.Var name="location" />}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: "6px 0", fontSize: 13 }}>
                              <strong>{t("details_ip")}</strong>:{" "}
                              {<SG.Var name="ip" />}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </SG.If>
                  </td>
                </tr>

                <tr>
                  <td css={p}>{t("outro")}</td>
                </tr>

                <tr>
                  <td css={muted}>{t("footer")}</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default AccountSecurityAlert;
