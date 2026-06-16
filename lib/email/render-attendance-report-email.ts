import { render } from "@react-email/render"
import {
  ManagerAttendanceReportEmail,
  type ManagerAttendanceReportEmailProps,
} from "@/emails/manager-attendance-report-email"

export async function renderManagerAttendanceReportEmail(
  props: ManagerAttendanceReportEmailProps,
): Promise<string> {
  return render(ManagerAttendanceReportEmail(props))
}
