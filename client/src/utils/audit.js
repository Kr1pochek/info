const actionLabels = {
  LOGIN: ['Вход в панель управления', 'Басқару панеліне кіру'],
  LOGOUT: ['Выход из панели управления', 'Басқару панелінен шығу'],
  CREATE_SERVICE: ['Добавление услуги', 'Қызметті қосу'],
  UPDATE_SERVICE: ['Изменение услуги', 'Қызметті өзгерту'],
  DELETE_SERVICE: ['Удаление услуги', 'Қызметті жою'],
  CREATE_CATEGORY: ['Добавление категории', 'Санатты қосу'],
  UPDATE_CATEGORY: ['Изменение категории', 'Санатты өзгерту'],
  DELETE_CATEGORY: ['Удаление категории', 'Санатты жою'],
  CREATE_SERVICE_PACKAGE: ['Добавление пакета обслуживания', 'Қызмет пакетін қосу'],
  UPDATE_SERVICE_PACKAGE: ['Изменение пакета обслуживания', 'Қызмет пакетін өзгерту'],
  DELETE_SERVICE_PACKAGE: ['Удаление пакета обслуживания', 'Қызмет пакетін жою'],
  CREATE_NEWS: ['Добавление новости', 'Жаңалықты қосу'],
  UPDATE_NEWS: ['Изменение новости', 'Жаңалықты өзгерту'],
  DELETE_NEWS: ['Удаление новости', 'Жаңалықты жою'],
  PUBLISH_NEWS: ['Публикация новости', 'Жаңалықты жариялау'],
  UNPUBLISH_NEWS: ['Снятие новости с публикации', 'Жаңалықты жарияланымнан алу'],
  CREATE_BROADCAST_ITEM: ['Добавление материала в эфир', 'Эфир материалын қосу'],
  UPDATE_BROADCAST_ITEM: ['Изменение материала эфира', 'Эфир материалын өзгерту'],
  DELETE_BROADCAST_ITEM: ['Удаление материала из эфира', 'Эфир материалын жою'],
  UPDATE_BROADCAST_SETTINGS: ['Изменение настроек эфира', 'Эфир баптауларын өзгерту'],
  CREATE_ADMIN: ['Добавление администратора', 'Әкімшіні қосу'],
  UPDATE_ADMIN: ['Изменение администратора', 'Әкімшіні өзгерту'],
  DELETE_ADMIN: ['Удаление администратора', 'Әкімшіні жою'],
  UPDATE_SETTINGS: ['Изменение настроек инфокиоска', 'Инфокиоск баптауларын өзгерту'],
  UPDATE_SAFETY: ['Изменение раздела этики и пожарной безопасности', 'Әдеп және өрт қауіпсіздігі бөлімін өзгерту'],
};

const entityLabels = {
  AdminUser: ['Администратор', 'Әкімші'],
  Service: ['Услуга', 'Қызмет'],
  Category: ['Категория', 'Санат'],
  ServicePackage: ['Пакет обслуживания', 'Қызмет пакеті'],
  News: ['Новость', 'Жаңалық'],
  BroadcastItem: ['Материал эфира', 'Эфир материалы'],
  Setting: ['Настройки', 'Баптаулар'],
};

export const auditActionOptions = Object.keys(actionLabels);

export function auditActionLabel(action, language = 'ru') {
  return actionLabels[action]?.[language === 'kz' ? 1 : 0] || (language === 'kz' ? 'Басқа әрекет' : 'Другое действие');
}

export function auditEntityLabel(entityType, language = 'ru') {
  return entityLabels[entityType]?.[language === 'kz' ? 1 : 0] || (language === 'kz' ? 'Жазба' : 'Запись');
}

export function auditSourceLabel(ipAddress, language = 'ru') {
  const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ipAddress);
  if (local) return language === 'kz' ? 'Осы компьютер' : 'Этот компьютер';
  return language === 'kz' ? 'Желілік қосылым' : 'Сетевое подключение';
}
