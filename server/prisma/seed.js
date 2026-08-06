import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  ['individuals', 'Физическим лицам', 'Жеке тұлғаларға', 'Услуги для граждан по вопросам налогообложения и государственных доходов.', 'Азаматтарға салық салу және мемлекеттік кірістер мәселелері бойынша қызметтер.', 'Users'],
  ['entrepreneurs', 'Индивидуальным предпринимателям', 'Жеке кәсіпкерлерге', 'Регистрация, отчётность и налоговые обязательства предпринимателей.', 'Кәсіпкерлерді тіркеу, есептілік және салық міндеттемелері.', 'BriefcaseBusiness'],
  ['legal-entities', 'Юридическим лицам', 'Заңды тұлғаларға', 'Информация для организаций и их ответственных сотрудников.', 'Ұйымдар мен олардың жауапты қызметкерлеріне арналған ақпарат.', 'Building2'],
  ['taxes-payments', 'Налоги и платежи', 'Салықтар мен төлемдер', 'Сроки, виды платежей и порядок исполнения обязательств.', 'Мерзімдер, төлем түрлері және міндеттемелерді орындау тәртібі.', 'Landmark'],
  ['transport', 'Транспорт', 'Көлік', 'Налоговые вопросы, связанные с транспортными средствами.', 'Көлік құралдарына қатысты салық мәселелері.', 'Car'],
  ['tax-debt', 'Налоговая задолженность', 'Салық берешегі', 'Порядок проверки и погашения налоговой задолженности.', 'Салық берешегін тексеру және өтеу тәртібі.', 'CircleDollarSign'],
  ['certificates', 'Справки и документы', 'Анықтамалар мен құжаттар', 'Получение справок и подтверждающих документов.', 'Анықтамалар мен растаушы құжаттарды алу.', 'FileText'],
  ['tax-reporting', 'Налоговая отчётность', 'Салық есептілігі', 'Формы, сроки и правила представления налоговой отчётности.', 'Салық есептілігін ұсыну нысандары, мерзімдері мен ережелері.', 'Files'],
  ['receipt-check', 'Проверка чеков', 'Чектерді тексеру', 'Информация о фискальных чеках и кассовых операциях.', 'Фискалдық чектер мен кассалық операциялар туралы ақпарат.', 'ReceiptText'],
  ['customs', 'Таможенные услуги', 'Кедендік қызметтер', 'Сведения о таможенном оформлении и обязательствах.', 'Кедендік ресімдеу мен міндеттемелер туралы мәліметтер.', 'Container'],
  ['appointments', 'Онлайн-бронирование', 'Қабылдауға жазылу', 'Порядок предварительной записи на приём в подразделение.', 'Бөлімшеге қабылдауға алдын ала жазылу тәртібі.', 'CalendarClock'],
  ['help', 'Помощь и консультации', 'Көмек және кеңес', 'Контакты и порядок получения консультационной помощи.', 'Кеңестік көмек алу байланыстары мен тәртібі.', 'MessagesSquare'],
];

const services = [
  ['individuals', 'property-tax', 'Налог на имущество физических лиц', 'Жеке тұлғалардың мүлік салығы', 'Home'],
  ['individuals', 'land-tax', 'Земельный налог для граждан', 'Азаматтарға арналған жер салығы', 'MapPinned'],
  ['entrepreneurs', 'ip-registration-info', 'Регистрация индивидуального предпринимателя', 'Жеке кәсіпкерді тіркеу', 'BadgeCheck'],
  ['entrepreneurs', 'special-tax-regimes', 'Специальные налоговые режимы', 'Арнаулы салық режимдері', 'Scale'],
  ['legal-entities', 'corporate-income-tax', 'Корпоративный подоходный налог', 'Корпоративтік табыс салығы', 'Building2'],
  ['legal-entities', 'vat-registration', 'Регистрационный учёт по НДС', 'ҚҚС бойынша тіркеу есебі', 'BadgePercent'],
  ['taxes-payments', 'tax-calendar', 'Календарь налоговых обязательств', 'Салық міндеттемелерінің күнтізбесі', 'CalendarDays'],
  ['taxes-payments', 'budget-payment-codes', 'Коды бюджетной классификации', 'Бюджеттік сыныптама кодтары', 'ListChecks'],
  ['transport', 'vehicle-tax', 'Налог на транспортные средства', 'Көлік құралдары салығы', 'Car'],
  ['transport', 'vehicle-tax-calculation', 'Порядок расчёта налога на транспорт', 'Көлік салығын есептеу тәртібі', 'Calculator'],
  ['tax-debt', 'tax-debt-information', 'Сведения о налоговой задолженности', 'Салық берешегі туралы мәліметтер', 'CircleDollarSign'],
  ['tax-debt', 'debt-repayment-order', 'Порядок погашения задолженности', 'Берешекті өтеу тәртібі', 'WalletCards'],
  ['certificates', 'tax-residency-certificate', 'Подтверждение налогового резидентства', 'Салық резиденттігін растау', 'FileBadge'],
  ['certificates', 'personal-account-extract', 'Выписка из лицевого счёта', 'Дербес шоттан үзінді көшірме', 'FileSpreadsheet'],
  ['tax-reporting', 'reporting-deadlines', 'Сроки представления налоговой отчётности', 'Салық есептілігін ұсыну мерзімдері', 'Clock3'],
  ['tax-reporting', 'reporting-withdrawal', 'Отзыв налоговой отчётности', 'Салық есептілігін кері қайтарып алу', 'Undo2'],
  ['receipt-check', 'fiscal-receipt-requirements', 'Требования к фискальному чеку', 'Фискалдық чекке қойылатын талаптар', 'ReceiptCheck'],
  ['receipt-check', 'cash-register-info', 'Контрольно-кассовые машины', 'Бақылау-касса машиналары', 'MonitorCog'],
  ['customs', 'customs-declaration', 'Таможенное декларирование', 'Кедендік декларациялау', 'ClipboardList'],
  ['customs', 'personal-goods', 'Товары для личного пользования', 'Жеке пайдалануға арналған тауарлар', 'Luggage'],
  ['appointments', 'appointment-procedure', 'Предварительная запись на приём', 'Қабылдауға алдын ала жазылу', 'CalendarCheck'],
  ['appointments', 'appointment-cancellation', 'Изменение или отмена записи', 'Жазбаны өзгерту немесе болдырмау', 'CalendarX'],
  ['help', 'contact-center', 'Единый контакт-центр 1414', '1414 бірыңғай байланыс орталығы', 'Headphones'],
  ['help', 'office-consultation', 'Консультация в подразделении ДГД', 'МКД бөлімшесіндегі кеңес', 'MessagesSquare'],
];

function serviceData([_categorySlug, slug, titleRu, titleKz, icon], index, categoryId) {
  return {
    slug, titleRu, titleKz,
    shortDescriptionRu: `Порядок получения информации и выполнения действий по услуге «${titleRu}».`,
    shortDescriptionKz: `«${titleKz}» қызметі бойынша ақпарат алу және іс-қимыл жасау тәртібі.`,
    fullDescriptionRu: `Услуга помогает получить полную справочную информацию по теме «${titleRu}». Ознакомьтесь с условиями, перечнем документов и последовательностью действий до обращения в подразделение ДГД.`,
    fullDescriptionKz: `Қызмет «${titleKz}» тақырыбы бойынша толық анықтамалық ақпарат алуға көмектеседі. МКД бөлімшесіне жүгінгенге дейін шарттармен, құжаттар тізбесімен және әрекеттер реттілігімен танысыңыз.`,
    targetAudienceRu: 'Физические и юридические лица, на которых распространяются соответствующие налоговые обязательства.',
    targetAudienceKz: 'Тиісті салық міндеттемелері қолданылатын жеке және заңды тұлғалар.',
    requiredDocumentsRu: ['Документ, подтверждающий полномочия представителя — при обращении представителя', 'Документы по предмету обращения — при наличии'],
    requiredDocumentsKz: ['Өкіл жүгінген кезде оның өкілеттігін растайтын құжат', 'Өтініш мәні бойынша құжаттар — бар болған жағдайда'],
    requiredDataRu: ['Сведения об объекте налогообложения или рассматриваемой операции', 'Период, за который требуется информация'],
    requiredDataKz: ['Салық салу объектісі немесе қаралатын операция туралы мәліметтер', 'Ақпарат талап етілетін кезең'],
    conditionsRu: 'Информация предоставляется в соответствии с действующим налоговым законодательством Республики Казахстан.',
    conditionsKz: 'Ақпарат Қазақстан Республикасының қолданыстағы салық заңнамасына сәйкес беріледі.',
    stepsRu: ['Определите нужную услугу и ознакомьтесь с требованиями', 'Подготовьте указанные документы и сведения', 'Обратитесь к сотруднику ДГД за консультацией или подачей документов', 'Получите результат в установленный срок'],
    stepsKz: ['Қажетті қызметті анықтап, талаптармен танысыңыз', 'Көрсетілген құжаттар мен мәліметтерді дайындаңыз', 'Кеңес алу немесе құжат тапсыру үшін МКД қызметкеріне жүгініңіз', 'Нәтижені белгіленген мерзімде алыңыз'],
    processingTimeRu: 'В соответствии с регламентом услуги; консультация предоставляется в день обращения.',
    processingTimeKz: 'Қызмет регламентіне сәйкес; кеңес жүгінген күні беріледі.',
    costRu: 'Консультация предоставляется бесплатно.', costKz: 'Кеңес тегін беріледі.',
    resultRu: 'Справочная информация, разъяснение либо документ, предусмотренный регламентом услуги.',
    resultKz: 'Анықтамалық ақпарат, түсіндірме немесе қызмет регламентінде көзделген құжат.',
    rejectionReasonsRu: ['Неполный комплект обязательных документов', 'Несоответствие представленных сведений установленным требованиям'],
    rejectionReasonsKz: ['Міндетті құжаттар топтамасының толық болмауы', 'Ұсынылған мәліметтердің белгіленген талаптарға сәйкес келмеуі'],
    contactsRu: 'Единый контакт-центр: 1414. Консультация также доступна у сотрудника ДГД.',
    contactsKz: 'Бірыңғай байланыс орталығы: 1414. Кеңесті МКД қызметкерінен де алуға болады.',
    officeAddressRu: 'г. Алматы, проспект Абылай хана, 93/95', officeAddressKz: 'Алматы қ., Абылай хан даңғылы, 93/95',
    workingHoursRu: 'Понедельник–пятница, 09:00–18:30; перерыв 13:00–14:30',
    workingHoursKz: 'Дүйсенбі–жұма, 09:00–18:30; үзіліс 13:00–14:30',
    keywordsRu: `${titleRu.toLowerCase()} налог услуга документы срок консультация`,
    keywordsKz: `${titleKz.toLowerCase()} салық қызмет құжаттар мерзім кеңес`,
    icon, categoryId, isPopular: index < 8 || index % 5 === 0, isPublished: true, sortOrder: index,
  };
}

async function main() {
  const { SEED_ADMIN_LOGIN, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME } = process.env;
  if (!SEED_ADMIN_LOGIN || !SEED_ADMIN_PASSWORD || !SEED_ADMIN_NAME) throw new Error('Заполните SEED_ADMIN_LOGIN, SEED_ADMIN_PASSWORD и SEED_ADMIN_NAME в server/.env');
  if (SEED_ADMIN_PASSWORD.length < 10) throw new Error('SEED_ADMIN_PASSWORD должен содержать не менее 10 символов');

  const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 12);
  await prisma.adminUser.upsert({
    where: { login: SEED_ADMIN_LOGIN.toLowerCase() },
    update: { fullName: SEED_ADMIN_NAME, role: 'SUPER_ADMIN', isActive: true },
    create: { login: SEED_ADMIN_LOGIN.toLowerCase(), passwordHash, fullName: SEED_ADMIN_NAME, role: 'SUPER_ADMIN' },
  });

  const categoryIds = {};
  for (let index = 0; index < categories.length; index += 1) {
    const [slug, titleRu, titleKz, descriptionRu, descriptionKz, icon] = categories[index];
    const row = await prisma.category.upsert({
      where: { slug }, update: { titleRu, titleKz, descriptionRu, descriptionKz, icon, isPublished: true, sortOrder: index },
      create: { slug, titleRu, titleKz, descriptionRu, descriptionKz, icon, isPublished: true, sortOrder: index },
    });
    categoryIds[slug] = row.id;
  }

  for (let index = 0; index < services.length; index += 1) {
    const definition = services[index];
    const data = serviceData(definition, index, categoryIds[definition[0]]);
    await prisma.service.upsert({ where: { slug: data.slug }, update: data, create: data });
  }

  await prisma.setting.upsert({
    where: { id: 1 }, update: { defaultLanguage: 'kz' },
    create: {
      id: 1,
      organizationNameRu: 'Департамент государственных доходов по городу Алматы',
      organizationNameKz: 'Алматы қаласы бойынша Мемлекеттік кірістер департаменті',
      contactPhone: '1414', addressRu: 'г. Алматы, проспект Абылай хана, 93/95', addressKz: 'Алматы қ., Абылай хан даңғылы, 93/95',
      workingHoursRu: 'Пн–Пт, 09:00–18:30; перерыв 13:00–14:30', workingHoursKz: 'Дс–Жм, 09:00–18:30; үзіліс 13:00–14:30',
      inactivitySeconds: 60, warningSeconds: 10, defaultLanguage: 'kz', showCurrentTime: true, maintenanceMode: false,
      maintenanceMessageRu: 'Сервис временно недоступен. Обратитесь к сотруднику ДГД.',
      maintenanceMessageKz: 'Қызмет уақытша қолжетімсіз. МКД қызметкеріне хабарласыңыз.', popularServicesCount: 6,
    },
  });
  console.log(`Seed завершён: ${categories.length} категорий, ${services.length} услуг, администратор ${SEED_ADMIN_LOGIN}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
