import InputAdornment from '@mui/material/InputAdornment';
import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Chip,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Select,
  MenuItem,
  Autocomplete,
  FormControl,
  InputLabel,
  FormHelperText,
  IconButton,
  Tooltip,
  DialogContentText
} from '@mui/material';
import { VolumeUp, Delete, Add as AddIcon } from '@mui/icons-material';

import { DataGrid } from '@mui/x-data-grid';
import { getEntityDisplayName } from '../../config/entities.config';
import { SourceLinksField } from '../Fields/SourceLinksField';
import { NotesField } from '../Fields/NotesField';
import { ImageUploadField } from '../Fields/ImageUploadField';
import { AddLinkModal } from '../Modals/AddLinkModal';
import { ItemImageGallery } from '../ItemImageGallery/ItemImageGallery';

// Типи
interface BaseEntity {
  id: number;
}

type EntityType =
  | 'pommel'
  | 'blade-type'
  | 'categories'
  | 'territories'
  | 'dolls'
  | 'epoha'
  | 'global-type'
  | 'guard-type'
  | 'sharpening'
  | 'usage'
  | 'weapons';

interface EntityConfig {
  name: string;
  displayName: string;
  apiEndpoint: string;
  columns: any[];
  formFields: FormField[];
  useForm?: boolean;
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'boolean';
  required?: boolean;
  maxLength?: number;
  options?: { value: any; label: string }[];
}

interface EditEntityFormProps<T extends BaseEntity> {
  open: boolean;
  entity: T | null;
  entityType: EntityType;
  onClose: () => void;
  onSave: (updatedEntity: T) => void;
  mode?: 'edit' | 'create';
  headerColor?: string;
  saveButtonText?: string;
}

interface FormData {
  [key: string]: any;
}

/** Однорядкові поля: сумарно −4px до попереднього макету (40px → 36px). */
const COMPACT_FIELD_HEIGHT = 36;
const COMPACT_FIELD_INPUT_PADDING = '6px 12px';

// Імпорт функцій буде виконано динамічно

export function EditEntityForm<T extends BaseEntity>({
  open,
  entity,
  entityType,
  onClose,
  onSave,
  mode = 'edit',
  headerColor,
  saveButtonText
}: EditEntityFormProps<T>) {
  const [formData, setFormData] = useState<FormData>({});
  const [territoryInputValue, setTerritoryInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: number, ukr_name: string }>>([]);
  const [territories, setTerritories] = useState<Array<{ id: number, ukr_name: string }>>([]);
  const [epohaList, setEpohaList] = useState<Array<{ id: number, ukr: string }>>([]);
  const [guardTypeList, setGuardTypeList] = useState<Array<{ id: number, ukr: string }>>([]);
  const [bladeTypeList, setBladeTypeList] = useState<Array<{ id: number, ukr: string }>>([]);
  const [globalTypeList, setGlobalTypeList] = useState<Array<{ id: number, ukr: string }>>([]);
  const [dollsList, setDollsList] = useState<Array<{ id: number, ukr: string }>>([]);
  const [usageList, setUsageList] = useState<Array<{ id: number, ukr: string }>>([]);
  const [sharpeningList, setSharpeningList] = useState<Array<{ id: number, ukr: string }>>([]);
  const [pommelList, setPommelList] = useState<Array<{ id: number, ukr: string }>>([]);
  const [config, setConfig] = useState<EntityConfig | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [linkedObjects, setLinkedObjects] = useState<Array<{
    id: number;
    item_id: number;
    other_item: number;
    ukr_name: string;
    eng_name: string;
    rus_name: string;
  }>>([]);
  const [linkedObjectsLoading, setLinkedObjectsLoading] = useState(false);
  const [linkedObjectsError, setLinkedObjectsError] = useState<string | null>(null);

  // State for add link modal
  const [addLinkModalOpen, setAddLinkModalOpen] = useState(false);

  const loadLinkedObjects = useCallback(async () => {
    if (entity && open && entityType === 'weapons') {
      setLinkedObjectsLoading(true);
      setLinkedObjectsError(null);
      try {
        const { apiService } = await import('../../services/api.service');
        const response = await apiService.getLinkedObjects(entity.id);
        console.log('📥 Отримано пов\'язані об\'єкти:', {
          count: response.length,
          data: response
        });

        if (Array.isArray(response)) {
          const validData = response.every(item =>
            item &&
            typeof item === 'object' &&
            'id' in item &&
            'ukr_name' in item &&
            'eng_name' in item &&
            'rus_name' in item
          );

          if (validData) {
            setLinkedObjects(response as any);
            console.log('✅ Дані пов\'язаних об\'єктів встановлено:', {
              count: response.length,
              firstItem: response[0]
            });
          } else {
            console.error('❌ Неправильна структура даних:', response);
            setLinkedObjectsError('Неправильний формат даних від сервера');
          }
        } else {
          console.error('❌ Неправильний тип даних:', typeof response);
          setLinkedObjectsError('Неправильний формат даних від сервера');
        }
      } catch (error) {
        console.error('❌ Помилка при завантаженні пов\'язаних об\'єктів:', error);
        setLinkedObjectsError('Не вдалося завантажити пов\'язані об\'єкти');
      } finally {
        setLinkedObjectsLoading(false);
      }
    }
  }, [entity?.id, open, entityType]);

  // Стани для діалогу видалення
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Функції для обробки видалення
  const handleDeleteClick = (linkId: number) => {
    setLinkToDelete(linkId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (linkToDelete === null) return;

    setIsDeleting(true);
    try {
      const { apiService } = await import('../../services/api.service');
      const success = await apiService.deleteLink(linkToDelete);

      if (success) {
        // Оновлюємо список лінків після видалення
        const updatedLinks = linkedObjects.filter(obj => obj.id !== linkToDelete);
        setLinkedObjects(updatedLinks);
      }
    } catch (error) {
      console.error('Помилка при видаленні лінка:', error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setLinkToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setLinkToDelete(null);
  };

  // Функція для завантаження доступних голосів
  const loadVoices = () => {
    if ('speechSynthesis' in window) {
      // Деякі браузери потребують часу для завантаження голосів
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // Якщо голоси ще не завантажені, чекаємо
        window.speechSynthesis.onvoiceschanged = () => {
          const loadedVoices = window.speechSynthesis.getVoices();
          console.log('🎤 Доступні голоси:', loadedVoices.map(v => `${v.name} (${v.lang})`));
        };
      } else {
        console.log('🎤 Доступні голоси:', voices.map(v => `${v.name} (${v.lang})`));
      }
    }
  };

  // Функція для тексту в мову
  const speakText = (text: string, _language: string = 'uk-UA') => {
    if ('speechSynthesis' in window) {
      // Зупиняємо поточне озвучування
      window.speechSynthesis.cancel();

      // Отримуємо доступні голоси
      const voices = window.speechSynthesis.getVoices();

      // Шукаємо український голос
      let ukrainianVoice = voices.find(voice =>
        voice.lang === 'uk-UA' ||
        voice.lang === 'uk' ||
        voice.name.toLowerCase().includes('ukrainian') ||
        voice.name.toLowerCase().includes('ukraine') ||
        voice.name.toLowerCase().includes('ukr')
      );

      // Якщо український голос не знайдено, шукаємо схожий
      if (!ukrainianVoice) {
        ukrainianVoice = voices.find(voice =>
          voice.lang.startsWith('uk') ||
          voice.name.toLowerCase().includes('slavic')
        );
      }

      const utterance = new SpeechSynthesisUtterance(text);

      // Встановлюємо українську мову
      utterance.lang = 'uk-UA';

      // Якщо знайшли український голос, використовуємо його
      if (ukrainianVoice) {
        utterance.voice = ukrainianVoice;
        
        console.log('🎤 Використовується український голос:', ukrainianVoice.name);
      } else {
        
        console.log('⚠️ Український голос не знайдено, використовується стандартний');
      }

      utterance.rate = 0.8; // Повільніше для кращого розуміння української
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } else {
      alert('Ваш браузер не підтримує озвучування тексту');
    }
  };

  // Функція для зупинки озвучування
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Функція для отримання назви предмету
  const getItemName = () => {
    if (!entity) return '';

    if (mode === 'create') {
      if (entityType === 'weapons') {
        const ukrName = (entity as any).ukr_name;
        const engName = (entity as any).eng_name;
        const name = ukrName || engName;
        if (name) return name;
      } else {
        const ukrName = (entity as any).ukr || (entity as any).ukr_name;
        const engName = (entity as any).eng || (entity as any).eng_name;
        const name = ukrName || engName;
        if (name) return name;
      }
      return `Новий запис: ${getEntityDisplayName(entityType)}`;
    }

    // Для зброї спробуємо отримати українську назву, потім англійську
    if (entityType === 'weapons') {
      const ukrName = (entity as any).ukr_name;
      const engName = (entity as any).eng_name;
      return ukrName || engName || `ID: ${entity.id}`;
    }

    // Для інших сутностей спробуємо отримати назву з поля ukr або ukr_name
    const ukrName = (entity as any).ukr || (entity as any).ukr_name;
    const engName = (entity as any).eng || (entity as any).eng_name;
    return ukrName || engName || `ID: ${entity.id}`;
  };

  // Завантаження конфігурації при зміні типу сутності
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { getEntityConfig } = await import('../../config/entities.config');
        setConfig(getEntityConfig(entityType));
      } catch (error) {
        console.error('Помилка завантаження конфігурації:', error);
      }
    };
    loadConfig();
  }, [entityType]);

  // Очищення озвучування при закритті модального вікна
  useEffect(() => {
    if (!open) {
      stopSpeaking();
    }

    return () => {
      stopSpeaking();
    };
  }, [open]);

  // Завантаження голосів при монтуванні компонента
  useEffect(() => {
    loadVoices();
  }, []);

  // Ініціалізація форми при відкритті
  useEffect(() => {
    if (entity && open && config) {
      console.log('🔍 Entity для ініціалізації:', entity);
      console.log('🔍 Config для ініціалізації:', config);

      const initialData: FormData = {};
      config.formFields.forEach(field => {
        let value: any = (entity as any)[field.name];

        console.log(`🔍 Поле ${field.name}:`, { value, type: typeof value, fieldType: field.type });

        // Обробляємо різні типи полів
        if (field.type === 'multiselect') {
          if (value === null || value === undefined || value === '') {
            value = [];
          } else if (!Array.isArray(value)) {
            value = [Number(value)];
          } else {
            value = value.map((v: any) => Number(v));
          }
        } else if (field.type === 'boolean') {
          // Для boolean полів використовуємо Boolean() для конвертації
          // Обробляємо випадки null, undefined, порожній рядок
          if (value === null || value === undefined || value === '') {
            value = false;
          } else {
            value = Boolean(value);
          }
        } else if (field.type === 'select') {
          if (value && !isNaN(Number(value))) {
            value = Number(value);
          } else if (value === null || value === undefined || value === '') {
            value = '';
          } else {
            value = String(value);
          }
        } else if (field.type === 'number') {
          if (value && !isNaN(Number(value))) {
            value = Number(value);
          } else if (value === null || value === undefined || value === '') {
            value = '';
          } else {
            value = String(value);
          }
        } else {
          value = value || ''; // Для текстових полів
        }

        initialData[field.name] = value;
      });

      // Додаємо імперські поля з entity (якщо вони є)
      if (entity) {
        const entityWithImperial = entity as any;
        initialData.total_len_in = entityWithImperial.total_len_in || '';
        initialData.blade_len_in = entityWithImperial.blade_len_in || '';
        initialData.handle_len_in = entityWithImperial.handle_len_in || '';
        initialData.handle_len_w_in = entityWithImperial.handle_len_w_in || '';
        initialData.width_in = entityWithImperial.width_in || '';
        initialData.guard_width_in = entityWithImperial.guard_width_in || '';
        initialData.thikness_in = entityWithImperial.thikness_in || '';
        initialData.weight_lb = entityWithImperial.weight_lb || '';
      }

      console.log('📝 Ініціалізація форми:', initialData);
      setFormData(initialData);
      setError(null);
    }
  }, [entity, open, config]);

  // Завантаження категорій та довідкових даних для зброї
  useEffect(() => {
    if (entityType === 'weapons' && open) {
      loadCategories();
      loadTerritories();
      loadReferenceData();
    }
  }, [entityType, open]);

  const loadCategories = async () => {
    try {
      const { apiService } = await import('../../services/api.service');
      const result = await apiService.getAllCategories();
      setCategories(result.items);
    } catch (error) {
      console.error('Помилка завантаження категорій:', error);
    }
  };

  const loadTerritories = async () => {
    try {
      const { apiService } = await import('../../services/api.service');
      const result = await apiService.getAllTerritories();
      setTerritories(result.items);
    } catch (error) {
      console.error('Помилка завантаження територій:', error);
    }
  };

  const loadReferenceData = async () => {
    try {
      const { apiService } = await import('../../services/api.service');

      console.log('🔄 Завантаження довідкових даних...');

      // Завантажуємо кожну таблицю окремо, щоб одна помилка не блокувала інші
      const loadData = async (apiCall: () => Promise<any>, name: string) => {
        try {
          const result = await apiCall();
          console.log(`✅ ${name}: ${result.items?.length || 0} записів`);
          return result.items || [];
        } catch (error) {
          console.error(`❌ Помилка завантаження ${name}:`, error);
          return [];
        }
      };

      // Завантажуємо всі довідкові дані паралельно
      const [epohaItems, guardTypeItems, bladeTypeItems, globalTypeItems, dollsItems, usageItems, sharpeningItems, pommelItems] = await Promise.all([
        loadData(() => apiService.getAllEpoha(), 'epoha'),
        loadData(() => apiService.getAllGuardTypes(), 'guard-type'),
        loadData(() => apiService.getAllBladeTypes(), 'blade-type'),
        loadData(() => apiService.getAllGlobalTypes(), 'global-type'),
        loadData(() => apiService.getAllDolls(), 'dolls'),
        loadData(() => apiService.getAllUsage(), 'usage'),
        loadData(() => apiService.getAllSharpening(), 'sharpening'),
        loadData(() => apiService.getAllPommel(), 'pommel')
      ]);

      console.log('📊 Встановлюємо дані в стан:', {
        epoha: epohaItems.length,
        guardType: guardTypeItems.length,
        bladeType: bladeTypeItems.length,
        globalType: globalTypeItems.length,
        dolls: dollsItems.length,
        usage: usageItems.length,
        sharpening: sharpeningItems.length,
        pommel: pommelItems.length
      });

      setEpohaList(epohaItems);
      setGuardTypeList(guardTypeItems);
      setBladeTypeList(bladeTypeItems);
      setGlobalTypeList(globalTypeItems);
      setDollsList(dollsItems);
      setUsageList(usageItems);
      setSharpeningList(sharpeningItems);
      setPommelList(pommelItems);

      console.log('✅ Довідкові дані завантажено успішно');
    } catch (error) {
      console.error('Помилка завантаження довідкових даних:', error);
    }
  };

  useEffect(() => {
    loadLinkedObjects();
  }, [loadLinkedObjects]);

  const handleInputChange = (fieldName: string, value: any) => {
    console.log(`🔄 handleInputChange: ${fieldName} = ${value} (${typeof value})`);

    // Очищаємо помилку при зміні полів
    if (error) {
      setError(null);
    }

    // Знаходимо поле в конфігурації
    const field = config?.formFields.find(f => f.name === fieldName);

    // Для boolean полів забезпечуємо правильний тип
    if (field?.type === 'boolean') {
      value = Boolean(value);
    }

    setFormData(prev => {
      const newData = {
        ...prev,
        [fieldName]: value
      };
      console.log(`📝 Новий formData для ${fieldName}:`, newData);
      return newData;
    });
  };

  const handleSave = async () => {
    if (!entity || !config) return;

    setLoading(true);
    setError(null);

    try {
      // Валідація обов'язкових полів
      const validationErrors: string[] = [];

      config.formFields.forEach(field => {
        if (field.required) {
          const value = formData[field.name];

          // Перевіряємо різні типи полів
          if (field.type === 'boolean') {
            // Boolean поля завжди мають значення (true/false)
            // Додаткова перевірка не потрібна
          } else if (field.type === 'select') {
            // Для select полів перевіряємо, чи є значення
            if (value === null || value === undefined || value === '' || value === 0) {
              validationErrors.push(`Поле "${field.label}" є обов'язковим`);
            }
          } else if (field.type === 'multiselect') {
            if (!Array.isArray(value) || value.length === 0) {
              validationErrors.push(`Поле "${field.label}" є обов'язковим`);
            }
          } else {
            // Для текстових полів перевіряємо, чи не пустий рядок
            if (!value || value.toString().trim() === '') {
              validationErrors.push(`Поле "${field.label}" є обов'язковим`);
            }
          }
        }
      });

      // Якщо є помилки валідації, показуємо їх
      if (validationErrors.length > 0) {
        setError(`Помилка валідації:\n${validationErrors.join('\n')}`);
        setLoading(false);
        return;
      }

      // Підготовка даних для відправки - конвертуємо boolean та числові поля
      const preparedData = { ...formData };

      // Конвертуємо boolean та числові поля
      config.formFields.forEach(field => {
        if (field.type === 'boolean') {
          preparedData[field.name] = Boolean(preparedData[field.name]);
        } else if (field.type === 'number') {
          if (preparedData[field.name] && !isNaN(Number(preparedData[field.name]))) {
            preparedData[field.name] = Number(preparedData[field.name]);
          } else if (preparedData[field.name] === '' || preparedData[field.name] === null || preparedData[field.name] === undefined) {
            preparedData[field.name] = null;
          }
        } else if (field.type === 'select') {
          if (preparedData[field.name] && !isNaN(Number(preparedData[field.name]))) {
            preparedData[field.name] = Number(preparedData[field.name]);
          } else if (preparedData[field.name] === '' || preparedData[field.name] === null || preparedData[field.name] === undefined) {
            preparedData[field.name] = null;
          }
        } else if (field.type === 'multiselect') {
          const isTerritoryField = field.name === 'territory_ids';
          preparedData[field.name] = Array.isArray(preparedData[field.name])
            ? preparedData[field.name].map((v: any) => {
                // Territory IDs can be strings for new territories to be created on the backend
                if (isTerritoryField && typeof v === 'string' && v.trim() && isNaN(Number(v))) {
                  return v;
                }
                return Number(v);
              }).filter((v: any) => {
                // For territories, drop IDs that no longer exist in the dictionary
                if (!isTerritoryField || typeof v !== 'number') return true;
                return territories.some(t => t.id === v);
              })
            : [];
        }
      });

      console.log('📤 Відправляємо дані:', preparedData);

      const { apiService } = await import('../../services/api.service');
      let updatedEntity;

      if (mode === 'create') {
        // Видаляємо ID з даних при створенні нового запису
        const { id, ...createData } = preparedData;
        updatedEntity = await apiService.createEntity(entityType, createData);
      } else {
        updatedEntity = await apiService.updateEntity(entityType, entity.id, preparedData);
      }

      onSave(updatedEntity as T);
      onClose();
    } catch (error: any) {
      setError(error.message || 'Помилка збереження');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Отримуємо поле готовності на рівні компонента
  const readyField = config?.formFields.find(field => field.name === 'ready');

  // Функція для перевірки валідності поля
  const isFieldValid = (field: FormField, value: any): boolean => {
    if (!field.required) return true;

    if (field.type === 'boolean') {
      return true; // Boolean поля завжди валідні
    } else if (field.type === 'select') {
      return value !== null && value !== undefined && value !== '' && value !== 0;
    } else if (field.type === 'multiselect') {
      return Array.isArray(value) && value.length > 0;
    } else {
      return value && value.toString().trim() !== '';
    }
  };

  // Функція для отримання помилки поля
  const getFieldError = (field: FormField, value: any): string | null => {
    if (!field.required) return null;

    if (!isFieldValid(field, value)) {
      return `Поле "${field.label}" є обов'язковим`;
    }

    return null;
  };

  // Функція для перевірки загальної валідності форми
  const isFormValid = (): boolean => {
    if (!config) return false;

    return config.formFields.every(field => isFieldValid(field, formData[field.name]));
  };

  // Функція для отримання всіх помилок форми
  const getFormErrors = (): string[] => {
    if (!config) return [];

    const errors: string[] = [];
    config.formFields.forEach(field => {
      const error = getFieldError(field, formData[field.name]);
      if (error) {
        errors.push(error);
      }
    });

    return errors;
  };

  // Функції для рендерингу табів
  const renderMainInfoTab = () => {
    if (!config) return null;

    const mainFields = config.formFields.filter(field =>
      !field.name.includes('description_') &&
      field.name !== 'id'
    );

    // Групуємо поля по категоріях
    const basicInfoFields = ['ukr_name', 'eng_name', 'rus_name'];
    const sizeFields = ['total_len', 'blade_len', 'handle_len', 'handle_len_w', 'width', 'guard_width', 'thikness', 'weight'];
    const imperialSizeFields = [
      { name: 'total_len_in', label: 'Загальна довжина (in)' },
      { name: 'blade_len_in', label: 'Довжина клинка (in)' },
      { name: 'handle_len_in', label: "Довжина руків'я (in)" },
      { name: 'handle_len_w_in', label: "Ширина руків'я (in)" },
      { name: 'width_in', label: 'Ширина клинка (in)' },
      { name: 'guard_width_in', label: 'Ширина гарди (in)' },
      { name: 'thikness_in', label: 'Товщина клинка (in)' },
      { name: 'weight_lb', label: 'Вага (lb)' }
    ];
    const bottomFields = ['source', 'links', 'comments'];
    const otherFields = mainFields.filter(field =>
      !basicInfoFields.includes(field.name) &&
      !sizeFields.includes(field.name) &&
      !bottomFields.includes(field.name) &&
      field.name !== 'ready' &&
      field.name !== 'category_ids' &&
      field.name !== 'territory_ids'
    );

    // Функція для групування полів по 3 в ряд
    const groupFieldsByThree = (fields: FormField[]) => {
      const groups = [];
      for (let i = 0; i < fields.length; i += 3) {
        groups.push(fields.slice(i, i + 3));
      }
      return groups;
    };

    // Функція для групування полів по 4 в ряд
    const groupFieldsByFour = (fields: FormField[]) => {
      const groups = [];
      for (let i = 0; i < fields.length; i += 4) {
        groups.push(fields.slice(i, i + 4));
      }
      return groups;
    };

    // Отримуємо поля для кожної секції
    const basicInfoFieldsList = mainFields.filter(field => basicInfoFields.includes(field.name));
    const sizeFieldsList = mainFields.filter(field => sizeFields.includes(field.name));
    const bottomFieldsList = mainFields.filter(field => bottomFields.includes(field.name));

    // Групуємо поля по 3 або 4
    const basicInfoGroups = groupFieldsByThree(basicInfoFieldsList);
    const otherGroups = groupFieldsByFour(otherFields);

    return (
      <Box>
        {/* Основна інформація */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{
            mb: 2,
            color: '#1976d2',
            fontWeight: 600,
            borderBottom: '2px solid #e3f2fd',
            pb: 0
          }}>
            Основна інформація
          </Typography>

          {/* Зображення для довідкових сутностей */}
          {['guard-type', 'pommel', 'sharpening'].includes(entityType) && entity && (
            <ImageUploadField
              entityType={entityType}
              entityId={entity.id}
              currentImageUrl={formData.image_url}
              onImageUpload={(imageUrl) => handleInputChange('image_url', imageUrl)}
              onImageDelete={() => handleInputChange('image_url', null)}
            />
          )}

          {/* Поле категорії окремим рядком */}
          {(() => {
            const categoryField = mainFields.find(field => field.name === 'category_ids');
            if (categoryField) {
              return (
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid  size={{ xs: 12 }}>
                    {renderField(categoryField)}
                  </Grid>
                </Grid>
              );
            }
            return null;
          })()}

          {(() => {
            const territoryField = mainFields.find(field => field.name === 'territory_ids');
            if (territoryField) {
              return (
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 12 }}>
                    {renderField(territoryField)}
                  </Grid>
                </Grid>
              );
            }
            return null;
          })()}

          {/* Основні поля по 3 в ряд */}
          {basicInfoGroups.map((group, groupIndex) => (
            <Grid container spacing={2} key={`basic-${groupIndex}`} sx={{ mb: 2 }}>
              {group.map((field) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }} key={field.name} sx={{ flex: 1 }}>
                  {renderField(field)}
                </Grid>
              ))}
            </Grid>
          ))}
        </Box>

        {/* Розміри */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{
            mb: 2,
            color: '#1976d2',
            fontWeight: 600,
            borderBottom: '2px solid #e3f2fd',
            pb: 0
          }}>
            Розміри
          </Typography>
          {/* Метричні одиниці (mm, g) */}
          <Typography variant="caption" sx={{ color: '#666', mb: 1, display: 'block' }}>
            Міліметри / Грами
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {sizeFieldsList.map((field) => (
              <Grid key={field.name} sx={{ flex: 1 }} size={{ xs: 12, sm: 6, md: 3, lg: 1.5 }}>
                {renderMetricField(field)}
              </Grid>
            ))}
          </Grid>
          
          {/* Імперські одиниці (inches, pounds) - read only */}
          {entityType === 'weapons' && (
            <>
              <Typography variant="caption" sx={{ color: '#666', mb: 1, display: 'block' }}>
                Дюйми / Фунти (авто-розрахунок)
              </Typography>
              <Grid container spacing={2}>
                {imperialSizeFields.map((field) => (
                  <Grid key={field.name} sx={{ flex: 1 }} size={{ xs: 12, sm: 6, md: 3, lg: 1.5 }}>
                    <TextField
                      label={field.label}
                      value={formatValueWithUnit(formData[field.name], field.name) || '-'}
                      disabled
                      size="small"
                      fullWidth
                      InputProps={{
                        sx: {
                          fontSize: '0.875rem'
                        }
                      }}
                      InputLabelProps={{
                        sx: {
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: '#64748b',
                          '&.MuiInputLabel-shrink': {
                            transform: 'translate(14px, -9px) scale(0.75) !important'
                          }
                        }
                      }}
                      sx={{
                        '& .MuiInputBase-input.Mui-disabled': {
                          WebkitTextFillColor: '#1976d2',
                          fontWeight: 500,
                          fontSize: '0.875rem'
                        },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          background: '#f8fafc'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(0, 0, 0, 0.23)'
                        }
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </Box>

        {/* Інше */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{
            mb: 2,
            color: '#1976d2',
            fontWeight: 600,
            borderBottom: '2px solid #e3f2fd',
            pb: 1
          }}>
            Інше
          </Typography>
          {otherGroups.map((group, groupIndex) => (
            <Grid container spacing={2} key={`other-${groupIndex}`} sx={{ mb: 2 }}>
              {group.map((field) => (
                <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3 }} key={field.name} sx={{ flex: 1 }}>
                  {renderField(field)}
                </Grid>
              ))}
            </Grid>
          ))}
        </Box>

        {/* Додаткова інформація внизу */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{
            mb: 2,
            color: '#1976d2',
            fontWeight: 600,
            borderBottom: '2px solid #e3f2fd',
            pb: 1
          }}>
            Додаткова інформація
          </Typography>
          <Grid container spacing={2} justifyContent="center" sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, md: 9 }} key="comments">
              {renderField(bottomFieldsList.find(f => f.name === 'comments')!)}
            </Grid>
          </Grid>
          
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }} key="links">
              {renderField(bottomFieldsList.find(f => f.name === 'links')!)}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} key="source">
              {renderField(bottomFieldsList.find(f => f.name === 'source')!)}
            </Grid>
          </Grid>
        </Box>
      </Box>
    );
  };

  const renderDescriptionTab = (descriptionField: string) => {
    if (!config) return null;

    const field = config.formFields.find(f => f.name === descriptionField);
    if (!field) return null;

    const isUkrainianDescription = descriptionField === 'description_ukr';
    const textToRead = formData[descriptionField] || '';

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
        {/* Компактна кнопка озвучування для українського опису */}
        {isUkrainianDescription && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <Tooltip title={isSpeaking ? "Зупинити озвучування" : "Озвучити текст українською"}>
              <IconButton
                onClick={() => isSpeaking ? stopSpeaking() : speakText(textToRead, 'uk-UA')}
                size="small"
                sx={{
                  color: isSpeaking ? '#dc2626' : '#0369a1',
                  background: isSpeaking ? '#fef2f2' : '#f0f9ff',
                  '&:hover': {
                    background: isSpeaking ? '#fee2e2' : '#e0f2fe',
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <VolumeUp />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Поле вводу з гнучкою висотою */}
        <Box sx={{ flex: 1, minHeight: 0 }}>
          {renderField(field)}
        </Box>
      </Box>
    );
  };

  
  // Форматування значення з одиницями виміру
  
    // Отримання одиниці виміру для поля
  const getUnitForField = (fieldName: string): string => {
    const mmFields = ['total_len', 'blade_len', 'handle_len', 'handle_len_w', 'width', 'guard_width', 'thikness'];
    if (mmFields.includes(fieldName)) return 'mm';
    if (fieldName === 'weight') return 'g';
    return '';
  };

  const formatValueWithUnit = (value: any, fieldName: string): string => {
    if (value === null || value === undefined || value === '') return '';
    
    const strValue = String(value);
    
    // Метрична система (mm, g)
    const mmFields = ['total_len', 'blade_len', 'handle_len', 'handle_len_w', 'width', 'guard_width', 'thikness'];
    if (mmFields.includes(fieldName)) {
      return strValue + ' mm';
    }
    if (fieldName === 'weight') {
      return strValue + ' g';
    }
    
    // Імперська система (in, lb)
    const inFields = ['total_len_in', 'blade_len_in', 'handle_len_in', 'handle_len_w_in', 'width_in', 'guard_width_in', 'thikness_in'];
    if (inFields.includes(fieldName)) {
      return strValue + ' in';
    }
    if (fieldName === 'weight_lb') {
      return strValue + ' lb';
    }
    
    return strValue;
  };

    // Рендеринг метричних полів з одиницями виміру в значенні
  const renderMetricField = (field: FormField) => {
    const unit = getUnitForField(field.name);
    if (!unit) {
      // Для полів без одиниць використовуємо стандартний рендеринг
      return renderField(field);
    }
    
    // Для полів з одиницями - модифікуємо поведінку
    const originalValue = formData[field.name] ?? '';
    const displayValue = originalValue ? `${originalValue} ${unit}` : '';
    
    // Повертаємо TextField з formatted значенням
    return (
      <TextField
        fullWidth
        label={field.label}
        value={displayValue}
        onChange={(e) => {
          // При редагуванні прибираємо одиниці
          const newValue = e.target.value.replace(/\s*${unit}$/, '').trim();
          handleInputChange(field.name, newValue);
        }}
        onFocus={(e) => {
          // При фокусі показуємо тільки число
          const numericValue = formData[field.name] ?? '';
          e.currentTarget.value = String(numericValue);
        }}
        onBlur={(e) => {
          // При втраті фокусу додаємо одиниці
          const value = formData[field.name];
          if (value) {
            e.currentTarget.value = `${value} ${unit}`;
          }
        }}
        size="small"
        InputLabelProps={{ shrink: true }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 1,
            background: 'white',
            height: COMPACT_FIELD_HEIGHT,
          },
          '& .MuiInputLabel-root': {
            fontWeight: 500,
            color: '#64748b',
            fontSize: '0.75rem',
          },
          '& .MuiInputBase-input': {
            padding: COMPACT_FIELD_INPUT_PADDING,
            fontSize: '0.875rem'
          }
        }}
      />
    );
  };

  const renderField = (field: FormField) => {
    // Захист від undefined field
    if (!field || !field.name) {
      console.warn('❌ renderField: field is undefined or has no name');
      return null;
    }
    const value = formData[field.name] ?? '';
    const isReadOnly = field.name === 'id';
    const isRequired = field.required;
    const fieldError = getFieldError(field, value);

    console.log(`🎯 Рендеринг поля ${field.name}:`, { value, type: typeof value, formDataValue: formData[field.name] });

    // Функція для додавання зірочки до лейбла
    const getLabel = () => {
      return isRequired ? `${field.label} *` : field.label;
    };

    switch (field.type) {
      case 'boolean':
        // Для boolean полів забезпечуємо правильний тип
        const booleanValue = value === null || value === undefined || value === '' ? false : Boolean(value);
        return (
          <FormControlLabel
            control={
              <Switch
                checked={booleanValue}
                onChange={(e) => handleInputChange(field.name, e.target.checked)}
                disabled={isReadOnly}
                size="small"
              />
            }
            label={getLabel()}
            sx={{
              '& .MuiFormControlLabel-label': {
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#64748b'
              }
            }}
          />
        );

      case 'textarea':
        // Dla source oraz links używamy chipów
        if (field.name === 'source' || field.name === 'links') {
          return (
            <SourceLinksField
              label={field.label}
              value={value || ''}
              onChange={(val) => handleInputChange(field.name, val)}
              disabled={isReadOnly}
            />
          );
        }
        
        // Dla comments używamy stylu notatnika
        if (field.name === 'comments') {
          return (
            <NotesField
              label={field.label}
              value={value || ''}
              onChange={(val) => handleInputChange(field.name, val)}
              disabled={isReadOnly}
              maxLength={field.maxLength}
            />
          );
        }
        
        return (
          <TextField
            fullWidth
            multiline
            rows={field.name.includes('description_') ? 12 : 2}
            label={getLabel()}
            value={value || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            disabled={isReadOnly}
            required={isRequired}
            error={!!fieldError}
            helperText={fieldError || (field.maxLength ? `${(value || '').length}/${field.maxLength}` : undefined)}
            inputProps={{ maxLength: field.maxLength, placeholder: '' }}
            size="small"
            InputLabelProps={{
              shrink: true
            }}
            InputProps={{
              endAdornment: getUnitForField(field.name) ? (
                <InputAdornment position="end" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                  {getUnitForField(field.name)}
                </InputAdornment>
              ) : undefined
            }}
            sx={{
              ...(field.name.includes('description_') ? {
                height: '100%',
                '& .MuiInputBase-root': {
                  height: '100%',
                  minHeight: '400px'
                },
                '& .MuiInputBase-input': {
                  height: '100% !important',
                  minHeight: '400px',
                  overflow: 'visible',
                  resize: 'none'
                }
              } : {}),
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                background: isReadOnly ? '#f8fafc' : 'white',
                height: field.name.includes('description_') ? '100%' : COMPACT_FIELD_HEIGHT,
                minHeight: field.name.includes('description_') ? '500px' : COMPACT_FIELD_HEIGHT,
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: fieldError ? '#d32f2f' : '#1976d2'
                  }
                },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: fieldError ? '#d32f2f' : '#1976d2',
                    borderWidth: 2
                  }
                }
              },
              '& .MuiInputLabel-root': {
                fontWeight: 500,
                color: fieldError ? '#d32f2f' : '#64748b',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                overflow: 'visible'
              }
            }}
          />
        );

      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={getLabel()}
            value={value || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value === '' ? '' : Number(e.target.value))}
            disabled={isReadOnly}
            required={isRequired}
            error={!!fieldError}
            helperText={fieldError}
            inputProps={{ maxLength: field.maxLength, placeholder: '' }}
            size="small"
            InputLabelProps={{
              shrink: true
            }}
            InputProps={{
              endAdornment: getUnitForField(field.name) ? (
                <InputAdornment position="end" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                  {getUnitForField(field.name)}
                </InputAdornment>
              ) : undefined
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                background: isReadOnly ? '#f8fafc' : 'white',
                height: COMPACT_FIELD_HEIGHT,
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: fieldError ? '#d32f2f' : '#1976d2'
                  }
                },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: fieldError ? '#d32f2f' : '#1976d2',
                    borderWidth: 2
                  }
                }
              },
              '& .MuiInputLabel-root': {
                fontWeight: 500,
                color: fieldError ? '#d32f2f' : '#64748b',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%'
              },
              '& .MuiInputLabel-root[data-shrink="true"]': {
                transform: 'translate(14px, -9px) scale(0.75) !important'
              },
              '& .MuiInputLabel-shrink': {
                transform: 'translate(14px, -9px) scale(0.75) !important'
              },
              '& .MuiOutlinedInput-notchedOutline': {
                '& > legend': {
                  fontSize: '0.75rem'
                }
              },
              '& .MuiInputBase-input': {
                padding: COMPACT_FIELD_INPUT_PADDING,
                fontSize: '0.875rem'
              }
            }}
          />
        );

      case 'multiselect': {
        const isTerritory = field.name === 'territory_ids';
        const availableOptions = isTerritory ? (territories || []) : (categories || []);
        const selectedOptions = availableOptions.filter(o => Array.isArray(value) && value.includes(o.id));
        // For territories, Autocomplete value is string labels; existing IDs are resolved to their names.
        // IDs that no longer exist in the territory dictionary are not shown.
        const territoryValue = isTerritory && Array.isArray(value)
          ? value.map(v => {
              if (typeof v === 'number') {
                const existing = availableOptions.find(o => o.id === v);
                return existing ? existing.ukr_name : null;
              }
              return v;
            }).filter(Boolean)
          : selectedOptions;

        return (
          <Autocomplete
            multiple
            size="small"
            disabled={isReadOnly}
            freeSolo={isTerritory}
            options={availableOptions}
            value={isTerritory ? territoryValue as any : selectedOptions}
            inputValue={isTerritory ? territoryInputValue : undefined}
            onInputChange={(_, newInputValue) => {
              if (isTerritory) setTerritoryInputValue(newInputValue);
            }}
            onBlur={() => {
              if (!isTerritory) return;
              const typed = territoryInputValue.trim();
              if (typed) {
                const current = Array.isArray(value) ? value : [];
                const exists = current.some((v: any) => {
                  if (typeof v === 'string') return v === typed;
                  const opt = availableOptions.find(o => o.id === v);
                  return opt?.ukr_name === typed || opt?.ukr === typed;
                });
                if (!exists) {
                  handleInputChange(field.name, [...current, typed]);
                }
                setTimeout(() => setTerritoryInputValue(''), 0);
              }
            }}
            onKeyDown={(e: any) => {
              if (isTerritory && (e.key === 'Enter' || e.key === 'Tab' || e.key === ',')) {
                e.preventDefault();
                const typed = territoryInputValue.trim();
                if (typed) {
                  const current = Array.isArray(value) ? value : [];
                  const exists = current.some((v: any) => {
                    if (typeof v === 'string') return v === typed;
                    const opt = availableOptions.find(o => o.id === v);
                    return opt?.ukr_name === typed || opt?.ukr === typed;
                  });
                  if (!exists) {
                    handleInputChange(field.name, [...current, typed]);
                  }
                  setTimeout(() => setTerritoryInputValue(''), 0);
                }
              }
            }}
            getOptionLabel={(option: any) => String(option.ukr_name || option.ukr || option.id || option || '')}
            isOptionEqualToValue={(option: any, val: any) => {
              if (isTerritory) {
                return (option.ukr_name || option.ukr || option.id || '') === val;
              }
              return option.id === val.id;
            }}
            filterSelectedOptions
            onChange={(_, newValue: any[]) => {
              if (isTerritory) {
                const result = newValue.map(item => {
                  if (typeof item === 'string') {
                    const existing = availableOptions.find(o => o.ukr_name === item || o.ukr === item);
                    return existing ? existing.id : item;
                  }
                  return item.id;
                });
                handleInputChange(field.name, result);
              } else {
                handleInputChange(field.name, newValue.map(c => c.id));
              }
            }}
            renderTags={(selected: any[], getTagProps) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={index}
                    label={String(option.ukr_name || option.ukr || option.id || option)}
                    size="small"
                    onDelete={() => {
                      if (isTerritory) {
                        const current = Array.isArray(value) ? value : [];
                        // option is the display label; find matching id or string value
                        const matchingId = availableOptions.find(o => (o.ukr_name || o.ukr) === option)?.id;
                        const newIds = current.filter(v => {
                          if (typeof v === 'string') return v !== option;
                          return v !== matchingId;
                        });
                        handleInputChange(field.name, newIds);
                      } else {
                        const newIds = (Array.isArray(value) ? value : []).filter(id => id !== option.id);
                        handleInputChange(field.name, newIds);
                      }
                    }}
                    sx={{
                      backgroundColor: '#e3f2fd',
                      '&:hover': {
                        backgroundColor: '#bbdefb'
                      },
                      '& .MuiChip-deleteIcon': {
                        color: '#ef9a9a',
                        transition: 'color 0.2s ease',
                        '&:hover': {
                          color: '#d32f2f'
                        }
                      }
                    }}
                  />
                ))}
              </Box>
            )}
            renderOption={(props, option: any, { selected }) => {
              const { key, ...rest } = props;
              return (
                <li key={key} {...rest} style={{ backgroundColor: selected ? '#e3f2fd' : 'inherit', fontWeight: selected ? 600 : 400 }}>
                  {String(option.ukr_name || option.ukr || option.id || option)}
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={getLabel()}
                error={!!fieldError}
                helperText={fieldError}
                size="small"
                required={isRequired}
                sx={{
                  borderRadius: 1,
                  background: isReadOnly ? '#f8fafc' : 'white',
                  minHeight: COMPACT_FIELD_HEIGHT,
                  '& .MuiInputBase-root': {
                    paddingTop: '3px',
                    paddingBottom: '3px',
                    minHeight: COMPACT_FIELD_HEIGHT
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: fieldError ? '#d32f2f' : undefined
                  }
                }}
              />
            )}
          />
        );
      }

      case 'select':
        // Обробка select полів
        let options: Array<{ id: number, ukr: string, image_url?: string }> = [];
        switch (field.name) {
          case 'epoha':
            options = epohaList;
            break;
          case 'guard_type':
            options = guardTypeList;
            break;
          case 'blade_type':
            options = bladeTypeList;
            break;
          case 'global_type':
            options = globalTypeList;
            break;
          case 'dolls':
            options = dollsList;
            break;
          case 'pommel':
            options = pommelList;
            break;
          case 'using_it':
            options = usageList;
            break;
          case 'sharpening':
            options = sharpeningList;
            break;
          default:
            options = [];
        }

        const selectedOption = options?.find(opt => opt.id === Number(value));
        console.log(`🔍 Рендеринг поля ${field.name}:`, {
          value,
          valueType: typeof value,
          optionsCount: options?.length || 0,
          options: options?.slice(0, 3) || [], // Показуємо перші 3 опції
          selectedOption,
          selectedOptionText: selectedOption?.ukr,
          // Додаємо інформацію про стани
          epohaListLength: epohaList?.length || 0,
          guardTypeListLength: guardTypeList?.length || 0,
          bladeTypeListLength: bladeTypeList?.length || 0,
          globalTypeListLength: globalTypeList?.length || 0,
          dollsListLength: dollsList?.length || 0,
          usageListLength: usageList?.length || 0,
          sharpeningListLength: sharpeningList?.length || 0
        });

        const displayValue = value && value !== '' && value !== null && value !== undefined ? String(value) : '';

        // Якщо дані ще не завантажилися, показуємо індикатор завантаження
        if (!options || options.length === 0) {
          return (
            <FormControl fullWidth size="small" error={!!fieldError}>
              <InputLabel
                id={`${field.name}-loading-label`}
                sx={{
                  fontWeight: 500,
                  color: fieldError ? '#d32f2f' : '#64748b',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%'
                }}
              >
                {getLabel()}
              </InputLabel>
              <Select
                labelId={`${field.name}-loading-label`}
                value=""
                label={getLabel()}
                disabled
                sx={{
                  borderRadius: 1,
                  background: '#f8fafc',
                  height: COMPACT_FIELD_HEIGHT
                }}
              >
                <MenuItem>Завантаження...</MenuItem>
              </Select>
              {fieldError && (
                <FormHelperText error>{fieldError}</FormHelperText>
              )}
            </FormControl>
          );
        }

        return (
          <FormControl fullWidth size="small" error={!!fieldError}>
            <InputLabel
              id={`${field.name}-label`}
              sx={{
                fontWeight: 500,
                color: fieldError ? '#d32f2f' : '#64748b',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%'
              }}
            >
              {getLabel()}
            </InputLabel>
            <Select
              labelId={`${field.name}-label`}
              value={displayValue}
              label={getLabel()}
              onChange={(e) => {
                console.log(`🔄 Зміна поля ${field.name}:`, e.target.value);
                const newValue = e.target.value === '' ? null : Number(e.target.value);
                handleInputChange(field.name, newValue);
              }}
              disabled={isReadOnly}
              required={isRequired}
              sx={{
                borderRadius: 1,
                background: isReadOnly ? '#f8fafc' : 'white',
                height: COMPACT_FIELD_HEIGHT,
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: fieldError ? '#d32f2f' : '#1976d2'
                  }
                },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: fieldError ? '#d32f2f' : '#1976d2',
                    borderWidth: 2
                  }
                },
                '& .MuiInputBase-input': {
                  padding: COMPACT_FIELD_INPUT_PADDING,
                  fontSize: '0.875rem'
                }
              }}
            >
              <MenuItem value="">Виберіть...</MenuItem>
              {options?.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {(field.name === 'guard_type' || field.name === 'pommel' || field.name === 'sharpening') && option.image_url && (
                      <img
                        src={option.image_url}
                        alt=""
                        style={{
                          width: 24,
                          height: 24,
                          objectFit: 'contain',
                          borderRadius: 2
                        }}
                      />
                    )}
                    <span>{option.ukr}</span>
                  </Box>
                </MenuItem>
              )) || []}
            </Select>
            {fieldError && (
              <FormHelperText error>{fieldError}</FormHelperText>
            )}
          </FormControl>
        );

      default:
        return (
          <TextField
            fullWidth
            label={getLabel()}
            value={value || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            disabled={isReadOnly}
            required={isRequired}
            error={!!fieldError}
            helperText={fieldError}
            inputProps={{ maxLength: field.maxLength, placeholder: '' }}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                background: isReadOnly ? '#f8fafc' : 'white',
                height: COMPACT_FIELD_HEIGHT,
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: fieldError ? '#d32f2f' : '#1976d2'
                  }
                },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: fieldError ? '#d32f2f' : '#1976d2',
                    borderWidth: 2
                  }
                }
              },
              '& .MuiInputLabel-root': {
                fontWeight: 500,
                color: fieldError ? '#d32f2f' : '#64748b',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%'
              },
              '& .MuiInputLabel-root[data-shrink="true"]': {
                transform: 'translate(14px, -9px) scale(0.75) !important'
              },
              '& .MuiInputLabel-shrink': {
                transform: 'translate(14px, -9px) scale(0.75) !important'
              },
              '& .MuiInputBase-input': {
                padding: COMPACT_FIELD_INPUT_PADDING,
                fontSize: '0.875rem'
              }
            }}
          />
        );
    }
  };

  const renderSimilarObjectsTab = () => {
    if (!config || !entity) return null;

    // Перевіряємо наявність даних
    if (!Array.isArray(linkedObjects)) {
      console.error('linkedObjects не є масивом:', linkedObjects);
      return null;
    }

    // Готуємо дані для таблиці
    const rows = linkedObjects.map((obj, index) => {
      console.log(`Обробка об'єкту ${index}:`, obj);
      return {
        id: index,
        link_id: obj.id,
        ukr_name: obj.ukr_name,
        eng_name: obj.eng_name,
        rus_name: obj.rus_name,
        item_id: obj.item_id
      };
    });

    console.log('Підготовлені рядки для таблиці:', rows);

    const columns: any[] = [
      {
        field: 'actions',
        headerName: 'Дії',
        width: 70,
        sortable: false,
        renderCell: (params: any) => (
          <Tooltip title="Видалити">
            <IconButton
              onClick={() => handleDeleteClick(params.row.link_id)}
              size="small"
              color="error"
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        )
      },
      {
        field: 'item_id',
        headerName: 'ID об\'єкта',
        width: 120,
        headerAlign: 'center',
        align: 'center',
        type: 'number'
      },
      {
        field: 'link_id',
        headerName: 'ID зв\'язку',
        width: 120,
        headerAlign: 'center',
        align: 'center',
        type: 'number'
      },
      {
        field: 'ukr_name',
        headerName: 'Українська назва',
        flex: 1,
        minWidth: 200
      },
      {
        field: 'eng_name',
        headerName: 'Англійська назва',
        flex: 1,
        minWidth: 200
      },
      {
        field: 'rus_name',
        headerName: 'Москальська назва',
        flex: 1,
        minWidth: 200
      }
    ];

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{
            color: '#1976d2',
            fontWeight: 600,
            borderBottom: '2px solid #e3f2fd',
            pb: 1
          }}>
            Схожі об'єкти ({rows.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddLinkModalOpen(true)}
            disabled={!entity || !entity.id}
            size="small"
          >
            Додати зв'язок
          </Button>
        </Box>

        <Box sx={{ flex: 1, minHeight: 400 }}>
          {linkedObjectsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : linkedObjectsError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {linkedObjectsError}
            </Alert>
          ) : rows.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Немає пов'язаних об'єктів
            </Alert>
          ) : (
            <Box sx={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={rows}
                columns={columns}
                disableColumnMenu
                disableRowSelectionOnClick
                getRowId={(row) => row.id}
                density="comfortable"
                initialState={{
                  sorting: {
                    sortModel: [{ field: 'link_id', sort: 'asc' }]
                  },
                  pagination: {
                    paginationModel: { pageSize: 10, page: 0 },
                  }
                }}
                pageSizeOptions={[5, 10, 15, 20, 25]}
                pagination
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-cell': {
                    borderColor: '#f1f5f9',
                    fontSize: '0.875rem',
                    padding: '8px 16px'
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#f8fafc',
                    borderRadius: 1,
                    borderBottom: '2px solid #e2e8f0'
                  },
                  '& .MuiDataGrid-row': {
                    '&:hover': {
                      backgroundColor: '#f1f5f9'
                    }
                  },
                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontWeight: 600,
                    color: '#475569'
                  },
                  '& .MuiDataGrid-footer': {
                    borderTop: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc'
                  }
                }}
              />
            </Box>
          )}
        </Box>

        {/* Діалог підтвердження видалення */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <DialogTitle id="delete-dialog-title">
            Підтвердження видалення
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-description">
              Ви дійсно хочете видалити зв'язок з ID {linkToDelete}? Цю дію неможливо відмінити.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              Скасувати
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              disabled={isDeleting}
              startIcon={isDeleting ? <CircularProgress size={20} /> : null}
            >
              Видалити
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  if (!entity || !config) return null;

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '95vh',
          width: '100.0vw',
          maxWidth: '1600px',
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid rgba(0, 0, 0, 0.08)'
        }
      }}
    >
      <DialogTitle sx={{
        background: headerColor || 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        borderRadius: '12px 12px 0 0',
        pt: 2,
        px: 3,
        pb: 1.5,
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)'
        }
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              {getItemName()}
            </Typography>
            {mode !== 'create' && (
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
                ID: {entity.id}
              </Typography>
            )}
          </Box>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            {readyField && (
              <FormControlLabel
                control={
                  <Switch
                    checked={formData[readyField.name] === null || formData[readyField.name] === undefined || formData[readyField.name] === '' ? false : Boolean(formData[readyField.name])}
                    onChange={(e) => handleInputChange(readyField.name, e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.08)'
                        }
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: 'rgba(255, 255, 255, 0.5)'
                      },
                      '& .MuiSwitch-switchBase': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.08)'
                        }
                      },
                      '& .MuiSwitch-track': {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)'
                      }
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{
                    color: 'white',
                    fontWeight: 500,
                    fontSize: '0.875rem'
                  }}>
                    {readyField.label}
                  </Typography>
                }
                sx={{
                  margin: 0,
                  '& .MuiFormControlLabel-label': {
                    marginLeft: 1
                  }
                }}
              />
            )}
          </Box>
        </Box>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="edit form tabs"
          sx={{
            mt: 1.5,
            mx: -0.5,
            minHeight: 0,
            '& .MuiTab-root': {
              minHeight: 40,
              borderRadius: 1.5,
              mx: 0.5,
              py: 0.75,
              fontWeight: 500,
              textTransform: 'none',
              fontSize: '0.8125rem',
              color: 'rgba(255,255,255,0.82)',
              '&.Mui-selected': {
                color: '#0f172a',
                background: 'rgba(255,255,255,0.95)',
                boxShadow: 'none'
              },
              '&:not(.Mui-selected):hover': {
                color: 'white',
                background: 'rgba(255,255,255,0.12)'
              }
            },
            '& .MuiTabs-indicator': {
              display: 'none'
            },
            '& .MuiTabs-scrollButtons': {
              color: 'rgba(255,255,255,0.9)'
            }
          }}
        >
          <Tab label="Основна інформація" />
          <Tab label="Опис українською" />
          <Tab label="Опис англійською" />
          <Tab label="Опис москальською" />
          <Tab label="Схожі об'єкти" />
          <Tab label="Зображення" />
        </Tabs>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Контент табів */}
        <Box sx={{
          mt: 3,
          mx: 3,
          background: 'white',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          p: 3,
          height: 'calc(100vh - 400px)',
          minHeight: '500px',
          maxHeight: '600px',
          overflow: 'auto'
        }}>
          {activeTab === 0 && renderMainInfoTab()}
          {activeTab === 1 && renderDescriptionTab('description_ukr')}
          {activeTab === 2 && renderDescriptionTab('description_eng')}
          {activeTab === 3 && renderDescriptionTab('description_rus')}
          {activeTab === 4 && renderSimilarObjectsTab()}
          {activeTab === 5 && <ItemImageGallery itemId={entity?.id || 0} />}
        </Box>
      </DialogContent>

      <DialogActions sx={{
        px: 2,
        py: 1.25,
        gap: 1,
        background: '#fafafa',
        borderTop: '1px solid',
        borderColor: 'divider',
        borderRadius: '0 0 12px 12px',
        justifyContent: 'flex-end'
      }}>
        <Button
          onClick={handleCancel}
          disabled={loading}
          variant="text"
          size="small"
          sx={{
            textTransform: 'none',
            fontSize: '0.875rem',
            color: 'text.secondary',
            minWidth: 'auto',
            px: 1.5,
            '&:hover': {
              background: 'action.hover'
            }
          }}
        >
          Скасувати
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !isFormValid()}
          size="small"
          startIcon={loading ? <CircularProgress size={16} /> : null}
          sx={{
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            px: 2,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none'
            }
          }}
        >
          {isFormValid() ? (saveButtonText || 'Зберегти') : `${saveButtonText || 'Зберегти'} (${getFormErrors().length} помилок)`}
        </Button>
      </DialogActions>

      {/* Add Link Modal */}
      <AddLinkModal
        open={addLinkModalOpen}
        onClose={() => setAddLinkModalOpen(false)}
        currentItemId={entity?.id || 0}
        currentItemName={(entity as any)?.ukr_name || (entity as any)?.eng_name || ''}
        onLinkAdded={loadLinkedObjects}
      />
    </Dialog>
  );
} 