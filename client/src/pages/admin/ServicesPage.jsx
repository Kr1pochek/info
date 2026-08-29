import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import api, { apiMessage } from "../../api/client.js";
import AdminPageHeader from "../../components/admin/AdminPageHeader.jsx";
import Toast from "../../components/admin/Toast.jsx";
import { ConfirmDialog, Modal } from "../../components/admin/Modal.jsx";
import { LoadingState } from "../../components/common/States.jsx";
import AppIcon from "../../components/common/AppIcon.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAdminI18n } from "../../utils/adminLocalization.js";

const listFields = [
  "requiredDocumentsRu",
  "requiredDocumentsKz",
  "requiredDataRu",
  "requiredDataKz",
  "stepsRu",
  "stepsKz",
  "rejectionReasonsRu",
  "rejectionReasonsKz",
];
const textPairs = [
  ["title", "Название", "input", 500],
  ["shortDescription", "Краткое описание", "textarea", 800],
  ["fullDescription", "Полное описание", "textarea", 10000],
  ["targetAudience", "Кому предназначена", "textarea", 3000],
  ["conditions", "Условия получения", "textarea", 5000],
  ["processingTime", "Срок оказания", "input", 300],
  ["cost", "Стоимость", "input", 300],
  ["result", "Результат услуги", "textarea", 3000],
  ["contacts", "Контакты", "textarea", 500],
  ["officeAddress", "Адрес подразделения", "textarea", 500],
  ["workingHours", "График работы", "textarea", 500],
  ["keywords", "Ключевые слова", "textarea", 1000],
];
const listPairs = [
  ["requiredDocuments", "Необходимые документы"],
  ["requiredData", "Необходимые данные"],
  ["steps", "Пошаговая инструкция"],
  ["rejectionReasons", "Причины отказа"],
];
const fieldLabelsKz = { title: "Атауы", shortDescription: "Қысқаша сипаттама", fullDescription: "Толық сипаттама", targetAudience: "Кімге арналған", conditions: "Алу шарттары", processingTime: "Көрсету мерзімі", cost: "Құны", result: "Қызмет нәтижесі", contacts: "Байланыстар", officeAddress: "Бөлімше мекенжайы", workingHours: "Жұмыс кестесі", keywords: "Түйінді сөздер" };
const listLabelsKz = { requiredDocuments: "Қажетті құжаттар", requiredData: "Қажетті деректер", steps: "Қадамдық нұсқаулық", rejectionReasons: "Бас тарту себептері" };
const icons = [
  "FileText",
  "Home",
  "MapPinned",
  "BadgeCheck",
  "Scale",
  "Building2",
  "BadgePercent",
  "CalendarDays",
  "ListChecks",
  "Car",
  "Calculator",
  "CircleDollarSign",
  "WalletCards",
  "FileBadge",
  "FileSpreadsheet",
  "Clock3",
  "Undo2",
  "ReceiptCheck",
  "MonitorCog",
  "ClipboardList",
  "Luggage",
  "CalendarCheck",
  "CalendarX",
  "Headphones",
  "MessagesSquare",
  "GraduationCap",
  "ListPlus",
  "RefreshCcw",
  "ScanLine",
  "ShieldCheck",
  "Tags",
];
const blank = {
  titleRu: "",
  titleKz: "",
  shortDescriptionRu: "",
  shortDescriptionKz: "",
  fullDescriptionRu: "",
  fullDescriptionKz: "",
  targetAudienceRu: "",
  targetAudienceKz: "",
  requiredDocumentsRu: "",
  requiredDocumentsKz: "",
  requiredDataRu: "",
  requiredDataKz: "",
  conditionsRu: "",
  conditionsKz: "",
  stepsRu: "",
  stepsKz: "",
  processingTimeRu: "",
  processingTimeKz: "",
  costRu: "",
  costKz: "",
  resultRu: "",
  resultKz: "",
  rejectionReasonsRu: "",
  rejectionReasonsKz: "",
  contactsRu: "",
  contactsKz: "",
  officeAddressRu: "",
  officeAddressKz: "",
  workingHoursRu: "",
  workingHoursKz: "",
  keywordsRu: "",
  keywordsKz: "",
  icon: "FileText",
  categoryId: "",
  isPopular: false,
  isPublished: true,
  sortOrder: 0,
};
const toForm = (row) =>
  Object.fromEntries(
    Object.keys(blank).map((key) => [
      key,
      listFields.includes(key)
        ? (row[key] || []).join("\n")
        : (row[key] ?? blank[key]),
    ]),
  );
const toPayload = (form) =>
  Object.fromEntries(
    Object.entries(form)
      .filter(([key]) => key !== "id")
      .map(([key, value]) => [
        key,
        listFields.includes(key)
          ? value
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean)
          : key === "categoryId" || key === "sortOrder"
            ? Number(value)
            : value,
      ]),
  );

function ServiceForm({
  form,
  setForm,
  categories,
  onSubmit,
  onCancel,
  busy,
  error,
}) {
  const { language, tr } = useAdminI18n();
  const [preview, setPreview] = useState("card");
  const update = (key, value) => setForm({ ...form, [key]: value });
  return (
    <form className="admin-form service-editor" onSubmit={onSubmit}>
      <div className="service-editor__toolbar">
        <div className="segmented">
          <button
            type="button"
            className={preview === "card" ? "active" : ""}
            onClick={() => setPreview("card")}
          >
            {tr("Карточка", "Карточка")}
          </button>
          <button
            type="button"
            className={preview === "page" ? "active" : ""}
            onClick={() => setPreview("page")}
          >
            {tr("Страница", "Бет")}
          </button>
        </div>
        <span>{tr("Предварительный вид", "Алдын ала қарау")}</span>
      </div>
      <div className="service-editor__layout">
        <div className="service-editor__fields">
          <fieldset>
            <legend>{tr("Основные данные", "Негізгі деректер")}</legend>
            <div className="form-grid">
              <label>
                <span>{tr("Категория", "Санат")}</span>
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) => update("categoryId", e.target.value)}
                >
                  <option value="">{tr("Выберите категорию", "Санатты таңдаңыз")}</option>
                  {categories.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item[language === "kz" ? "titleKz" : "titleRu"]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{tr("Иконка")}</span>
                <select
                  value={form.icon}
                  onChange={(e) => update("icon", e.target.value)}
                >
                  {icons.map((icon) => (
                    <option key={icon}>{icon}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>{tr("Порядок")}</span>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  required
                  value={form.sortOrder}
                  onChange={(e) => update("sortOrder", e.target.value)}
                />
              </label>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => update("isPublished", e.target.checked)}
                />
                <span>{tr("Опубликована")}</span>
              </label>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={form.isPopular}
                  onChange={(e) => update("isPopular", e.target.checked)}
                />
                <span>{tr("Популярная", "Танымал")}</span>
              </label>
            </div>
          </fieldset>
          {textPairs.map(([base, label, type, max]) => (
            <fieldset key={base}>
              <legend>{tr(label, fieldLabelsKz[base])}</legend>
              <div className="form-grid">
                <label>
                  <span>{tr("Русский", "Орысша")}</span>
                  {type === "textarea" ? (
                    <textarea
                      required
                      maxLength={max}
                      value={form[`${base}Ru`]}
                      onChange={(e) => update(`${base}Ru`, e.target.value)}
                    />
                  ) : (
                    <input
                      required
                      maxLength={max}
                      value={form[`${base}Ru`]}
                      onChange={(e) => update(`${base}Ru`, e.target.value)}
                    />
                  )}
                </label>
                <label>
                  <span>{tr("Казахский", "Қазақша")}</span>
                  {type === "textarea" ? (
                    <textarea
                      required
                      maxLength={max}
                      value={form[`${base}Kz`]}
                      onChange={(e) => update(`${base}Kz`, e.target.value)}
                    />
                  ) : (
                    <input
                      required
                      maxLength={max}
                      value={form[`${base}Kz`]}
                      onChange={(e) => update(`${base}Kz`, e.target.value)}
                    />
                  )}
                </label>
              </div>
            </fieldset>
          ))}
          {listPairs.map(([base, label]) => (
            <fieldset key={base}>
              <legend>{tr(`${label} — один пункт на строку`, `${listLabelsKz[base]} — әр жолға бір тармақ`)}</legend>
              <div className="form-grid">
                <label>
                  <span>{tr("Русский", "Орысша")}</span>
                  <textarea
                    required
                    value={form[`${base}Ru`]}
                    onChange={(e) => update(`${base}Ru`, e.target.value)}
                  />
                </label>
                <label>
                  <span>{tr("Казахский", "Қазақша")}</span>
                  <textarea
                    required
                    value={form[`${base}Kz`]}
                    onChange={(e) => update(`${base}Kz`, e.target.value)}
                  />
                </label>
              </div>
            </fieldset>
          ))}
        </div>
        <aside className={`editor-preview editor-preview--${preview}`}>
          <div className="editor-preview__icon">
            <AppIcon name={form.icon} size={preview === "page" ? 56 : 32} />
          </div>
          <span>
            {categories.find((item) => item.id === Number(form.categoryId))
              ?.[language === "kz" ? "titleKz" : "titleRu"] || tr("Категория", "Санат")}
          </span>
          <h3>{form[language === "kz" ? "titleKz" : "titleRu"] || tr("Название услуги", "Қызмет атауы")}</h3>
          <p>
            {preview === "page"
              ? form[language === "kz" ? "fullDescriptionKz" : "fullDescriptionRu"] || tr("Полное описание услуги появится здесь.", "Қызметтің толық сипаттамасы осында көрсетіледі.")
              : form[language === "kz" ? "shortDescriptionKz" : "shortDescriptionRu"] || tr("Краткое описание услуги появится здесь.", "Қызметтің қысқаша сипаттамасы осында көрсетіледі.")}
          </p>
          {preview === "page" && (
            <>
              <h4>{tr("Порядок получения", "Алу тәртібі")}</h4>
              <ol>
                {form[language === "kz" ? "stepsKz" : "stepsRu"]
                  .split("\n")
                  .filter(Boolean)
                  .map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
              </ol>
            </>
          )}
          <button type="button">{tr("Подробнее", "Толығырақ")}</button>
        </aside>
      </div>
      {error && <div className="form-error">{tr(error)}</div>}
      <div className="form-actions">
        <button
          type="button"
          className="admin-button admin-button--secondary"
          onClick={onCancel}
        >
          {tr("Отмена")}
        </button>
        <button className="admin-button admin-button--primary" disabled={busy}>
          {busy ? tr("Сохранение…") : tr("Сохранить услугу", "Қызметті сақтау")}
        </button>
      </div>
    </form>
  );
}

export default function ServicesPage() {
  const { user } = useAuth();
  const { language, locale, tr } = useAdminI18n();
  const [rows, setRows] = useState(null);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    search: "",
    published: "",
    categoryId: "",
    page: 1,
  });
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");
  const canDelete = ["SUPER_ADMIN", "ADMIN"].includes(user.role);
  const params = useMemo(
    () => ({ ...filters, limit: 20, sort: "updatedAt", direction: "desc" }),
    [filters],
  );
  const load = useCallback(async () => {
    try {
      const [servicesResponse, categoriesResponse] = await Promise.all([
        api.get("/admin/services", { params }),
        api.get("/admin/categories", {
          params: { limit: 100, sort: "sortOrder", direction: "asc" },
        }),
      ]);
      setRows(servicesResponse.data.data);
      setMeta(servicesResponse.data.meta);
      setCategories(categoriesResponse.data.data);
    } catch (err) {
      setToast({ type: "error", message: apiMessage(err) });
    }
  }, [params]);
  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);
  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = toPayload(editing);
      if (editing.id) await api.patch(`/admin/services/${editing.id}`, payload);
      else await api.post("/admin/services", payload);
      setEditing(null);
      setToast({ message: editing.id ? "Услуга обновлена" : "Услуга создана" });
      await load();
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/services/${deleting.id}`);
      setDeleting(null);
      setToast({ message: "Услуга удалена" });
      await load();
    } catch (err) {
      setDeleting(null);
      setToast({ type: "error", message: apiMessage(err) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <AdminPageHeader
        eyebrow="Контент"
        eyebrowKz="Контент"
        title="Услуги"
        titleKz="Қызметтер"
        description="Двуязычные карточки и подробные инструкции для посетителей"
        descriptionKz="Келушілерге арналған екі тілдегі карточкалар мен толық нұсқаулықтар"
        actions={
          <button
            className="admin-button admin-button--primary"
            onClick={() => setEditing({ ...blank })}
          >
            <Plus size={19} />
            {tr("Новая услуга", "Жаңа қызмет")}
          </button>
        }
      />
      <div className="admin-toolbar admin-toolbar--filters">
        <label className="admin-search">
          <Search />
          <input
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value, page: 1 })
            }
            placeholder={tr("Поиск по услугам", "Қызметтерді іздеу")}
          />
        </label>
        <select
          value={filters.categoryId}
          onChange={(e) =>
            setFilters({ ...filters, categoryId: e.target.value, page: 1 })
          }
        >
          <option value="">{tr("Все категории", "Барлық санаттар")}</option>
          {categories.map((item) => (
            <option value={item.id} key={item.id}>
              {item[language === "kz" ? "titleKz" : "titleRu"]}
            </option>
          ))}
        </select>
        <select
          value={filters.published}
          onChange={(e) =>
            setFilters({ ...filters, published: e.target.value, page: 1 })
          }
        >
          <option value="">{tr("Все статусы", "Барлық күйлер")}</option>
          <option value="true">{tr("Опубликованные", "Жарияланған")}</option>
          <option value="false">{tr("Скрытые", "Жасырын")}</option>
        </select>
        <span>{meta.total} {tr("записей", "жазба")}</span>
      </div>
      {!rows ? (
        <LoadingState />
      ) : (
        <div className="admin-card admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{tr("Услуга", "Қызмет")}</th>
                <th>{tr("Категория", "Санат")}</th>
                <th>{tr("Статус")}</th>
                <th>{tr("Порядок")}</th>
                <th>{tr("Обновлена", "Жаңартылған")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="table-title">
                      <span>
                        <AppIcon name={item.icon} size={22} />
                      </span>
                      <div>
                        <strong>{item[language === "kz" ? "titleKz" : "titleRu"]}</strong>
                        <small>{item.slug}</small>
                      </div>
                    </div>
                  </td>
                  <td>{item.category[language === "kz" ? "titleKz" : "titleRu"]}</td>
                  <td>
                    <span
                      className={`status-pill ${item.isPublished ? "status-pill--success" : "status-pill--muted"}`}
                    >
                      {item.isPublished ? tr("Опубликована") : tr("Скрыта")}
                    </span>
                    {item.isPopular && (
                      <span className="status-pill status-pill--accent">
                        {tr("Популярная", "Танымал")}
                      </span>
                    )}
                  </td>
                  <td>{item.sortOrder}</td>
                  <td>
                    {new Date(item.updatedAt).toLocaleDateString(locale)}
                  </td>
                  <td>
                    <div className="row-actions">
                      <a
                        href={`/service/${item.slug}`}
                        aria-label={tr("Предпросмотр", "Алдын ала қарау")}
                      >
                        <Eye />
                      </a>
                      <button
                        onClick={() =>
                          setEditing({ id: item.id, ...toForm(item) })
                        }
                      >
                        <Edit3 />
                      </button>
                      {canDelete && (
                        <button onClick={() => setDeleting(item)}>
                          <Trash2 />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {meta.pages > 1 && (
        <div className="pagination">
          <button
            disabled={meta.page <= 1}
            onClick={() => setFilters({ ...filters, page: meta.page - 1 })}
          >
            <ChevronLeft />
            {tr("Назад")}
          </button>
          <span>
            {tr("Страница", "Бет")} {meta.page} {tr("из", "ішінен")} {meta.pages}
          </span>
          <button
            disabled={meta.page >= meta.pages}
            onClick={() => setFilters({ ...filters, page: meta.page + 1 })}
          >
            {tr("Далее")}
            <ChevronRight />
          </button>
        </div>
      )}
      {editing && (
        <Modal
          title={editing.id ? "Редактирование услуги" : "Новая услуга"}
          titleKz={editing.id ? "Қызметті өңдеу" : "Жаңа қызмет"}
          onClose={() => setEditing(null)}
          wide
        >
          <ServiceForm
            form={editing}
            setForm={setEditing}
            categories={categories}
            onSubmit={save}
            onCancel={() => setEditing(null)}
            busy={busy}
            error={error}
          />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          title="Удалить услугу?"
          titleKz="Қызметті жою керек пе?"
          text={`Услуга «${deleting.titleRu}» и связанные с ней данные будут удалены.`}
          textKz={`«${deleting.titleKz}» қызметі және онымен байланысты деректер жойылады.`}
          onConfirm={remove}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}
      <Toast {...toast} onClose={() => setToast(null)} />
    </>
  );
}
