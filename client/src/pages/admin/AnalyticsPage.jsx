import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  CalendarRange,
  Clock3,
  MousePointerClick,
  Search,
} from "lucide-react";
import api, { apiMessage } from "../../api/client.js";
import AdminPageHeader from "../../components/admin/AdminPageHeader.jsx";
import { ErrorState, LoadingState } from "../../components/common/States.jsx";

function dateString(date) {
  return date.toISOString().slice(0, 10);
}
export default function AnalyticsPage() {
  const initialTo = new Date();
  const initialFrom = new Date(Date.now() - 29 * 86400000);
  const [period, setPeriod] = useState({
    from: dateString(initialFrom),
    to: dateString(initialTo),
  });
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    try {
      const response = await api.get("/admin/analytics", { params: period });
      setData(response.data.data);
    } catch (err) {
      setError(apiMessage(err));
    }
  }, [period]);
  useEffect(() => {
    load();
  }, [load]);
  const eventCount = (type) =>
    data?.byType.find((item) => item.eventType === type)?._count?._all || 0;
  const max = Math.max(...(data?.daily || []).map((item) => item.count), 1);
  return (
    <>
      <AdminPageHeader
        eyebrow="Статистика"
        title="Аналитика киоска"
        description="Только обезличенные события взаимодействия посетителей"
        actions={
          <div className="date-filter">
            <CalendarRange />
            <input
              type="date"
              value={period.from}
              max={period.to}
              onChange={(e) => setPeriod({ ...period, from: e.target.value })}
            />
            <span>—</span>
            <input
              type="date"
              value={period.to}
              min={period.from}
              onChange={(e) => setPeriod({ ...period, to: e.target.value })}
            />
          </div>
        }
      />
      {error ? (
        <ErrorState
          title="Не удалось загрузить аналитику"
          text={error}
          onRetry={load}
        />
      ) : !data ? (
        <LoadingState />
      ) : (
        <>
          <div className="stat-grid stat-grid--analytics">
            <article className="stat-card stat-card--navy">
              <div>
                <span>Открытия услуг</span>
                <strong>{eventCount("SERVICE_OPEN")}</strong>
              </div>
              <MousePointerClick />
            </article>
            <article className="stat-card stat-card--violet">
              <div>
                <span>Поисковые запросы</span>
                <strong>{eventCount("SEARCH")}</strong>
              </div>
              <Search />
            </article>
            <article className="stat-card stat-card--orange">
              <div>
                <span>Завершения по таймеру</span>
                <strong>{data.timeouts}</strong>
              </div>
              <Clock3 />
            </article>
            <article className="stat-card stat-card--cyan">
              <div>
                <span>Всего событий</span>
                <strong>
                  {data.byType.reduce((sum, item) => sum + item._count._all, 0)}
                </strong>
              </div>
              <BarChart3 />
            </article>
          </div>
          <div className="analytics-grid">
            <section className="admin-card chart-card admin-card--wide">
              <header>
                <div>
                  <span>Динамика</span>
                  <h2>События по дням</h2>
                </div>
              </header>
              <div className="bar-chart bar-chart--large">
                {data.daily.map((item) => (
                  <div className="bar-chart__item" key={item.day}>
                    <span>{item.count}</span>
                    <i
                      style={{
                        height: `${Math.max(5, (item.count / max) * 100)}%`,
                      }}
                    />
                    <small>
                      {new Date(item.day).toLocaleDateString("ru-RU", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </small>
                  </div>
                ))}
              </div>
            </section>
            <section className="admin-card">
              <header>
                <h2>Популярные услуги</h2>
              </header>
              <ol className="rank-list">
                {data.popularServices.map((item, index) => (
                  <li key={item.id}>
                    <span>{index + 1}</span>
                    <strong>{item.titleRu}</strong>
                    <em>{item.count}</em>
                  </li>
                ))}
              </ol>
            </section>
            <section className="admin-card">
              <header>
                <h2>Популярные категории</h2>
              </header>
              <ol className="rank-list">
                {data.popularCategories.map((item, index) => (
                  <li key={item.id}>
                    <span>{index + 1}</span>
                    <strong>{item.titleRu}</strong>
                    <em>{item.count}</em>
                  </li>
                ))}
              </ol>
            </section>
            <section className="admin-card">
              <header>
                <h2>Поисковые запросы</h2>
              </header>
              <ol className="rank-list">
                {data.popularSearches.map((item, index) => (
                  <li key={`${item.query}-${index}`}>
                    <span>{index + 1}</span>
                    <strong>{item.query}</strong>
                    <em>{item.count}</em>
                  </li>
                ))}
              </ol>
            </section>
            <section className="admin-card admin-card--wide admin-table-wrap">
              <header>
                <h2>Последние события</h2>
              </header>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Событие</th>
                    <th>Услуга / категория</th>
                    <th>Запрос</th>
                    <th>Время</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="status-pill status-pill--neutral">
                          {item.eventType}
                        </span>
                      </td>
                      <td>
                        {item.service?.titleRu || item.category?.titleRu || "—"}
                      </td>
                      <td>{item.searchQuery || "—"}</td>
                      <td>
                        {new Date(item.createdAt).toLocaleString("ru-RU")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </>
      )}
    </>
  );
}
