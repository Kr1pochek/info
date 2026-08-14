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
import { useAdminI18n } from "../../utils/adminLocalization.js";

function dateString(date) {
  return date.toISOString().slice(0, 10);
}
export default function AnalyticsPage() {
  const { language, locale, tr } = useAdminI18n();
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
        eyebrowKz="Статистика"
        title="Аналитика киоска"
        titleKz="Киоск талдауы"
        description="Только обезличенные события взаимодействия посетителей"
        descriptionKz="Келушілер әрекетінің тек дербестендірілмеген оқиғалары"
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
          title={tr("Не удалось загрузить аналитику", "Талдауды жүктеу мүмкін болмады")}
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
                <span>{tr("Открытия услуг", "Қызметтерді ашу")}</span>
                <strong>{eventCount("SERVICE_OPEN")}</strong>
              </div>
              <MousePointerClick />
            </article>
            <article className="stat-card stat-card--violet">
              <div>
                <span>{tr("Поисковые запросы", "Іздеу сұраулары")}</span>
                <strong>{eventCount("SEARCH")}</strong>
              </div>
              <Search />
            </article>
            <article className="stat-card stat-card--orange">
              <div>
                <span>{tr("Завершения по таймеру", "Таймер бойынша аяқталу")}</span>
                <strong>{data.timeouts}</strong>
              </div>
              <Clock3 />
            </article>
            <article className="stat-card stat-card--cyan">
              <div>
                <span>{tr("Всего событий", "Барлық оқиғалар")}</span>
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
                  <span>{tr("Динамика", "Динамика")}</span>
                  <h2>{tr("События по дням", "Күндер бойынша оқиғалар")}</h2>
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
                      {new Date(item.day).toLocaleDateString(locale, {
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
                <h2>{tr("Популярные услуги", "Танымал қызметтер")}</h2>
              </header>
              <ol className="rank-list">
                {data.popularServices.map((item, index) => (
                  <li key={item.id}>
                    <span>{index + 1}</span>
                    <strong>{item[language === "kz" ? "titleKz" : "titleRu"]}</strong>
                    <em>{item.count}</em>
                  </li>
                ))}
              </ol>
            </section>
            <section className="admin-card">
              <header>
                <h2>{tr("Популярные категории", "Танымал санаттар")}</h2>
              </header>
              <ol className="rank-list">
                {data.popularCategories.map((item, index) => (
                  <li key={item.id}>
                    <span>{index + 1}</span>
                    <strong>{item[language === "kz" ? "titleKz" : "titleRu"]}</strong>
                    <em>{item.count}</em>
                  </li>
                ))}
              </ol>
            </section>
            <section className="admin-card">
              <header>
                <h2>{tr("Поисковые запросы", "Іздеу сұраулары")}</h2>
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
                <h2>{tr("Последние события", "Соңғы оқиғалар")}</h2>
              </header>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{tr("Событие", "Оқиға")}</th>
                    <th>{tr("Услуга / категория", "Қызмет / санат")}</th>
                    <th>{tr("Запрос", "Сұрау")}</th>
                    <th>{tr("Время", "Уақыт")}</th>
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
                        {item.service?.[language === "kz" ? "titleKz" : "titleRu"] || item.category?.[language === "kz" ? "titleKz" : "titleRu"] || "—"}
                      </td>
                      <td>{item.searchQuery || "—"}</td>
                      <td>
                        {new Date(item.createdAt).toLocaleString(locale)}
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
