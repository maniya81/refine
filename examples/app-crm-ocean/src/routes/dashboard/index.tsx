import { Col, Row } from "antd";

import { useLeadCount } from "@/services/lead.service";

import {
  CalendarUpcomingEvents,
  DashboardDealsChart,
  DashboardLatestActivities,
  DashboardTotalCountCard,
} from "./components";

export const DashboardPage = () => {
  // Fetch lead counts from API
  const { data: totalLeads, isLoading: loadingTotal } = useLeadCount();
  const { data: openLeads, isLoading: loadingOpen } = useLeadCount({
    excludeStages: ["WON", "LOST"],
  });
  const { data: wonLeads, isLoading: loadingWon } = useLeadCount({
    stage: "WON",
  });
  const { data: lostLeads, isLoading: loadingLost } = useLeadCount({
    stage: "LOST",
  });

  return (
    <div className="page-container">
      <Row gutter={[32, 32]}>
        <Col xs={24} sm={24} xl={6}>
          <DashboardTotalCountCard
            resource="leads"
            isLoading={loadingTotal}
            totalCount={totalLeads?.total_count ?? 0}
            data={
              totalLeads?.count_by_month?.map((m) => ({
                index: m.month,
                value: m.count,
              })) ?? []
            }
          />
        </Col>
        <Col xs={24} sm={24} xl={6}>
          <DashboardTotalCountCard
            resource="open"
            isLoading={loadingOpen}
            totalCount={openLeads?.total_count ?? 0}
            data={
              openLeads?.count_by_month?.map((m) => ({
                index: m.month,
                value: m.count,
              })) ?? []
            }
          />
        </Col>
        <Col xs={24} sm={24} xl={6}>
          <DashboardTotalCountCard
            resource="won"
            isLoading={loadingWon}
            totalCount={wonLeads?.total_count ?? 0}
            data={
              wonLeads?.count_by_month?.map((m) => ({
                index: m.month,
                value: m.count,
              })) ?? []
            }
          />
        </Col>
        <Col xs={24} sm={24} xl={6}>
          <DashboardTotalCountCard
            resource="lost"
            isLoading={loadingLost}
            totalCount={lostLeads?.total_count ?? 0}
            data={
              lostLeads?.count_by_month?.map((m) => ({
                index: m.month,
                value: m.count,
              })) ?? []
            }
          />
        </Col>
      </Row>

      <Row
        gutter={[32, 32]}
        style={{
          marginTop: "32px",
        }}
      >
        <Col
          xs={24}
          sm={24}
          xl={8}
          style={{
            height: "460px",
          }}
        >
          <CalendarUpcomingEvents />
        </Col>
        <Col
          xs={24}
          sm={24}
          xl={16}
          style={{
            height: "460px",
          }}
        >
          <DashboardDealsChart />
        </Col>
      </Row>

      <Row
        gutter={[32, 32]}
        style={{
          marginTop: "32px",
        }}
      >
        <Col xs={24}>
          <DashboardLatestActivities />
        </Col>
      </Row>
    </div>
  );
};
