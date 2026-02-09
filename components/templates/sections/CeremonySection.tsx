"use client";

import { motion } from "framer-motion";
import { Calendar, MapPin, Phone } from "lucide-react";
import type { Invitation } from "@/schemas/invitation";
import type { SerializableTheme } from "@/lib/templates/types";
import { formatWeddingDateTime } from "@/lib/utils/date";
import { HeadingRenderer } from "../renderers/HeadingRenderer";
import { DividerRenderer } from "../renderers/DividerRenderer";
import { DDayWidget } from "./DDayWidget";

interface CeremonySectionProps {
  data: Invitation;
  theme: SerializableTheme;
}

type CeremonyInnerProps = CeremonySectionProps & { fullDateStr: string; weddingDate: Date; calendarStyle: string };

/** Minimal 전용: 가운데 정렬 레이아웃 */
function CeremonyCentered({ data, theme, fullDateStr, weddingDate, calendarStyle }: CeremonyInnerProps) {
  return (
    <section className={theme.sectionPadding}>
      <div className={theme.contentMaxWidth}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-10"
        >
          {/* 날짜/시간 */}
          <div>
            <Calendar className={`w-4 h-4 ${theme.iconColor} mx-auto mb-4`} />
            <p className={`${theme.labelClass} mb-3`}>
              {theme.ceremonyDateLabel}
            </p>
            <p className={theme.cardValueClass}>{fullDateStr}</p>

            {/* D-Day 위젯 */}
            {calendarStyle !== 'none' && (
              <DDayWidget weddingDate={weddingDate} theme={theme} style={calendarStyle as 'calendar' | 'countdown' | 'minimal'} />
            )}
          </div>

          {/* 장소 */}
          <div>
            <MapPin className={`w-4 h-4 ${theme.iconColor} mx-auto mb-4`} />
            <p className={`${theme.labelClass} mb-3`}>
              {theme.ceremonyVenueLabel}
            </p>
            <p className={`${theme.mapVenueNameClass}`}>
              {data.wedding.venue.name}
              {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
            </p>
            <p className={`${theme.mapAddressClass} mt-2`}>
              {data.wedding.venue.address}
            </p>
            {data.wedding.venue.tel && (
              <a
                href={`tel:${data.wedding.venue.tel}`}
                className={`${theme.phoneLinkClass} mt-3`}
              >
                <Phone className="w-3 h-3" />
                {data.wedding.venue.tel}
              </a>
            )}
          </div>

          {/* 안내사항 */}
          {data.content.notice && (
            <div className={theme.noticeBg}>
              <DividerRenderer config={theme.ceremonyNoticeDivider} />
              <p className={theme.noticeTextClass}>
                {data.content.notice}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/** 카드 기반 레이아웃 (Classic/Modern/Floral/Elegant/Natural) */
function CeremonyCards({ data, theme, fullDateStr, weddingDate, calendarStyle }: CeremonyInnerProps) {
  return (
    <section className={theme.sectionPadding}>
      <div className={theme.contentMaxWidth}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="space-y-4 md:space-y-6"
        >
          {theme.ceremonyHeading && (
            <HeadingRenderer config={theme.ceremonyHeading} fallbackClass={theme.headingClass}>
              Ceremony
            </HeadingRenderer>
          )}

          {/* 날짜/시간 */}
          <div className={theme.cardClass}>
            <Calendar className={`w-5 h-5 md:w-6 md:h-6 ${theme.iconColor} mt-0.5 flex-shrink-0`} />
            <div>
              <h4 className={theme.cardLabelClass}>{theme.ceremonyDateLabel}</h4>
              <p className={theme.cardValueClass}>{fullDateStr}</p>
            </div>
          </div>

          {/* D-Day 위젯 */}
          {calendarStyle !== 'none' && (
            <DDayWidget weddingDate={weddingDate} theme={theme} style={calendarStyle as 'calendar' | 'countdown' | 'minimal'} />
          )}

          {/* 장소 */}
          <div className={theme.cardClass}>
            <MapPin className={`w-5 h-5 md:w-6 md:h-6 ${theme.iconColor} mt-0.5 flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <h4 className={theme.cardLabelClass}>{theme.ceremonyVenueLabel}</h4>
              <p className={`${theme.cardValueClass} font-medium mb-1`}>
                {data.wedding.venue.name}
                {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
              </p>
              <p className={`${theme.cardSubTextClass} mb-2 md:mb-3`}>
                {data.wedding.venue.address}
              </p>
              {data.wedding.venue.tel && (
                <a
                  href={`tel:${data.wedding.venue.tel}`}
                  className={`inline-flex items-center gap-2 text-sm ${theme.accentColor} py-2 min-h-[44px]`}
                >
                  <Phone className="w-4 h-4" />
                  {data.wedding.venue.tel}
                </a>
              )}
            </div>
          </div>

          {/* 안내사항 */}
          {data.content.notice && (
            <div className={theme.noticeBg}>
              <p className={theme.noticeTextClass}>
                {data.content.notice}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

export function CeremonySection({ data, theme }: CeremonySectionProps) {
  const weddingDate = new Date(data.wedding.date);
  const fullDateStr = formatWeddingDateTime(weddingDate);
  const calendarStyle = (data.settings?.calendarStyle as string) ?? 'calendar';

  if (theme.ceremonyCentered) {
    return <CeremonyCentered data={data} theme={theme} fullDateStr={fullDateStr} weddingDate={weddingDate} calendarStyle={calendarStyle} />;
  }
  return <CeremonyCards data={data} theme={theme} fullDateStr={fullDateStr} weddingDate={weddingDate} calendarStyle={calendarStyle} />;
}
