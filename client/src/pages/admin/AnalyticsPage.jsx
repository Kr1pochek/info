import { useCallback, useEffect, useState } from "react";
import {
  CalendarRange,
  Clock3,
  MousePointerClick,
  Search,
  Users,
} from "lucide-react";
import api, { apiMessage } from "../../api/client.js";
import AdminPageHeader from "../../components/admin/AdminPageHeader.jsx";
import { ErrorState, LoadingState } from "../../components/common/States.jsx";
import { useAdminI18n } from "../../utils/adminLocalization.js";

function dateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const eventLabels = {
  SERVICE_OPEN: ["Открытие услуги", "Қызметті ашу"],
  CATEGORY_OPEN: ["Открытие категории", "Санатты ашу"],
  SEARCH: ["Поиск", "Іздеу"],
  SESSION_TIMEOUT: ["Завершение по таймеру", "Таймер бойынша аяқтау"],
  SESSION_RESET: ["Сброс сеанса", "Сеансты қалпына келтіру"],
  LANGUAGE_CHANGE: ["Смена языка", "Тілді ауыстыру"],
  FONT_SIZE_CHANGE: ["Настройка отображения", "Көріністі баптау"],
  HOME_RETURN: ["Возврат на главную", "Басты бетке оралу"],
};

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
        description="Фактические обезличенные действия только на экране инфокиоска; повторная доставка событий исключается"
        descriptionKz="Тек инфокиоск экранындағы нақты дербестендірілмеген әрекеттер; оқиғалардың қайталануы есептелмейді"
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
            <article className="stat-card stat-card--cyan">
              <div>
                <span>{tr("Сеансы посетителей", "Келушілер сеанстары")}</span>
                <strong>{data.sessions}</strong>
              </div>
              <Users />
            </article>
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
                {data.daily.length ? data.daily.map((item) => (
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
                )) : <p>{tr("Достоверных событий за выбранный период пока нет", "Таңдалған кезеңде расталған оқиғалар әлі жоқ")}</p>}
              </div>
            </section>
            <section className="admin-card">
              <header>
                <h2>{tr("Популярные услуги", "Танымал қызметтер")}</h2>
              </header>
              <ol className="rank-list">
                {data.popularServices.length ? data.popularServices.map((item, index) => (
                  <li key={item.id}>
                    <span>{index + 1}</span>
                    <strong>{item[language === "kz" ? "titleKz" : "titleRu"]}</strong>
                    <em>{item.count}</em>
                  </li>
                )) : <li className="empty-row">{tr("Данных пока нет", "Әзірге деректер жоқ")}</li>}
              </ol>
            </section>
            <section className="admin-card">
              <header>
                <h2>{tr("Популярные категории", "Танымал санаттар")}</h2>
              </header>
              <ol className="rank-list">
                {data.popularCategories.length ? data.popularCategories.map((item, index) => (
                  <li key={item.id}>
                    <span>{index + 1}</span>
                    <strong>{item[language === "kz" ? "titleKz" : "titleRu"]}</strong>
                    <em>{item.count}</em>
                  </li>
                )) : <li className="empty-row">{tr("Данных пока нет", "Әзірге деректер жоқ")}</li>}
              </ol>
            </section>
            <section className="admin-card">
              <header>
                <h2>{tr("Поисковые запросы", "Іздеу сұраулары")}</h2>
              </header>
              <ol className="rank-list">
                {data.popularSearches.length ? data.popularSearches.map((item, index) => (
                  <li key={`${item.query}-${index}`}>
                    <span>{index + 1}</span>
                    <strong>{item.query}</strong>
                    <em>{item.count}</em>
                  </li>
                )) : <li className="empty-row">{tr("Данных пока нет", "Әзірге деректер жоқ")}</li>}
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
                  {data.recent.length ? data.recent.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="status-pill status-pill--neutral">
                          {eventLabels[item.eventType]?.[language === "kz" ? 1 : 0] || item.eventType}
                        </span>
                      </td>
                      <td>
                        {item.service?.[language === "kz" ? "titleKz" : "titleRu"] || item.category?.[language === "kz" ? "titleKz" : "titleRu"] || "—"}
                      </td>
                      <td>{item.searchQuery || "—"}</td>
                      <td>
                        {new Date(item.occurredAt).toLocaleString(locale)}
                      </td>
                    </tr>
                  )) : <tr><td colSpan="4" className="empty-row">{tr("Достоверных событий за выбранный период пока нет", "Таңдалған кезеңде расталған оқиғалар әлі жоқ")}</td></tr>}
                </tbody>
              </table>
            </section>
          </div>
        </>
      )}
    </>
  );
}
