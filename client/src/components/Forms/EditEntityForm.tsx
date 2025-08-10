import React, { useState, useEffect } from 'react';
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
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  IconButton,
  Tooltip
} from '@mui/material';
import { VolumeUp } from '@mui/icons-material';

// Типи
interface BaseEntity {
  id: number;
}

type EntityType =
  | 'apple'
  | 'blade-type'
  | 'categories'
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
  type: 'text' | 'textarea' | 'select' | 'number' | 'boolean';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: number, ukr_name: string }>>([]);
  const [epohaList, setEpohaList] = useState<Array<{ id: number, ukr: string }>>([]);
  const [guardTypeList, setGuardTypeList] = useState<Array<{ id: number, ukr: string }>>([]);
  const [bladeTypeList, setBladeTypeList] = useState<Array<{ id: number, ukr: string }>>([]);
  const [globalTypeList, setGlobalTypeList] = useState<Array<{ id: number, ukr: string }>>([]);
  const [dollsList, setDollsList] = useState<Array<{ id: number, ukr: string }>>([]);
  const [usageList, setUsageList] = useState<Array<{ id: number, ukr: string }>>([]);
  const [sharpeningList, setSharpeningList] = useState<Array<{ id: number, ukr: string }>>([]);
  const [appleList, setAppleList] = useState<Array<{ id: number, ukr: string }>>([]);
  const [config, setConfig] = useState<EntityConfig | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentVoice, setCurrentVoice] = useState<string>('');

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
  const speakText = (text: string, language: string = 'uk-UA') => {
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
        setCurrentVoice(ukrainianVoice.name);
        console.log('🎤 Використовується український голос:', ukrainianVoice.name);
      } else {
        setCurrentVoice('Стандартний голос');
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
        let value = entity[field.name as keyof T];

        console.log(`🔍 Поле ${field.name}:`, { value, type: typeof value, fieldType: field.type });

        // Обробляємо різні типи полів
        if (field.type === 'boolean') {
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

      console.log('📝 Ініціалізація форми:', initialData);
      setFormData(initialData);
      setError(null);
    }
  }, [entity, open, config]);

  // Завантаження категорій та довідкових даних для зброї
  useEffect(() => {
    if (entityType === 'weapons' && open) {
      loadCategories();
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
      const [epohaItems, guardTypeItems, bladeTypeItems, globalTypeItems, dollsItems, usageItems, sharpeningItems, appleItems] = await Promise.all([
        loadData(() => apiService.getAllEpoha(), 'epoha'),
        loadData(() => apiService.getAllGuardTypes(), 'guard-type'),
        loadData(() => apiService.getAllBladeTypes(), 'blade-type'),
        loadData(() => apiService.getAllGlobalTypes(), 'global-type'),
        loadData(() => apiService.getAllDolls(), 'dolls'),
        loadData(() => apiService.getAllUsage(), 'usage'),
        loadData(() => apiService.getAllSharpening(), 'sharpening'),
        loadData(() => apiService.getAllApple(), 'apple')
      ]);

      console.log('📊 Встановлюємо дані в стан:', {
        epoha: epohaItems.length,
        guardType: guardTypeItems.length,
        bladeType: bladeTypeItems.length,
        globalType: globalTypeItems.length,
        dolls: dollsItems.length,
        usage: usageItems.length,
        sharpening: sharpeningItems.length,
        apple: appleItems.length
      });

      setEpohaList(epohaItems);
      setGuardTypeList(guardTypeItems);
      setBladeTypeList(bladeTypeItems);
      setGlobalTypeList(globalTypeItems);
      setDollsList(dollsItems);
      setUsageList(usageItems);
      setSharpeningList(sharpeningItems);
      setAppleList(appleItems);

      console.log('✅ Довідкові дані завантажено успішно');
    } catch (error) {
      console.error('Помилка завантаження довідкових даних:', error);
    }
  };

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

      onSave(updatedEntity);
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
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
    const bottomFields = ['source', 'links', 'comments'];
    const otherFields = mainFields.filter(field =>
      !basicInfoFields.includes(field.name) &&
      !sizeFields.includes(field.name) &&
      !bottomFields.includes(field.name) &&
      field.name !== 'ready' &&
      field.name !== 'category_id'
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
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{
            mb: 2,
            color: '#1976d2',
            fontWeight: 600,
            borderBottom: '2px solid #e3f2fd',
            pb: 1
          }}>
            Основна інформація
          </Typography>



          {/* Поле категорії окремим рядком */}
          {(() => {
            const categoryField = mainFields.find(field => field.name === 'category_id');
            if (categoryField) {
              return (
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12}>
                    {renderField(categoryField)}
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
                <Grid item xs={12} sm={6} md={4} lg={4} key={field.name} sx={{ flex: 1 }}>
                  {renderField(field)}
                </Grid>
              ))}
            </Grid>
          ))}
        </Box>

        {/* Розміри */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{
            mb: 2,
            color: '#1976d2',
            fontWeight: 600,
            borderBottom: '2px solid #e3f2fd',
            pb: 1
          }}>
            Розміри
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {sizeFieldsList.map((field) => (
              <Grid item xs={12} sm={6} md={3} lg={1.5} key={field.name} sx={{ flex: 1 }}>
                {renderField(field)}
              </Grid>
            ))}
          </Grid>
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
                <Grid item xs={12} sm={6} md={3} lg={3} key={field.name} sx={{ flex: 1 }}>
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
          <Grid container spacing={2}>
            {bottomFieldsList.map((field) => (
              <Grid item xs={12} sm={6} md={4} lg={4} key={field.name} sx={{ flex: 1 }}>
                {renderField(field)}
              </Grid>
            ))}
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

  const renderField = (field: FormField) => {
    const value = formData[field.name];
    const isReadOnly = field.name === 'id';
    const isRequired = field.required;
    const fieldError = getFieldError(field, value);

    console.log(`🎯 Рендеринг поля ${field.name}:`, { value, type: typeof value, formData: formData[field.name] });

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
                height: field.name.includes('description_') ? '100%' : '40px',
                minHeight: field.name.includes('description_') ? '500px' : '40px',
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
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                background: isReadOnly ? '#f8fafc' : 'white',
                height: '40px',
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
                padding: '8px 12px',
                fontSize: '0.875rem'
              }
            }}
          />
        );

      case 'select':
        if (field.name === 'category_id') {
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
                value={String(value || '')}
                label={getLabel()}
                onChange={(e) => handleInputChange(field.name, Number(e.target.value))}
                disabled={isReadOnly}
                required={isRequired}
                sx={{
                  borderRadius: 1,
                  background: isReadOnly ? '#f8fafc' : 'white',
                  height: '40px',
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
                    padding: '8px 12px',
                    fontSize: '0.875rem'
                  }
                }}
              >
                <MenuItem value="">Виберіть...</MenuItem>
                {categories?.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.ukr_name}
                  </MenuItem>
                )) || []}
              </Select>
              {fieldError && (
                <FormHelperText error>{fieldError}</FormHelperText>
              )}
            </FormControl>
          );
        }

        // Обробка інших select полів
        let options: Array<{ id: number, ukr: string }> = [];
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
          case 'apple':
            options = appleList;
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
                  height: '40px'
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
                height: '40px',
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
                  padding: '8px 12px',
                  fontSize: '0.875rem'
                }
              }}
            >
              <MenuItem value="">Виберіть...</MenuItem>
              {options?.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.ukr}
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
                height: '40px',
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
                padding: '8px 12px',
                fontSize: '0.875rem'
              }
            }}
          />
        );
    }
  };

  const renderSimilarObjectsTab = () => {
    if (!config || !entity) return null;

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" sx={{
          mb: 2,
          color: '#1976d2',
          fontWeight: 600,
          borderBottom: '2px solid #e3f2fd',
          pb: 1
        }}>
          Схожі об'єкти
        </Typography>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Тут буде логіка для відображення схожих об'єктів */}
          <Typography variant="body2" color="text.secondary">
            Функціонал знаходиться в розробці...
          </Typography>
        </Box>
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
        padding: '24px 32px',
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)'
        }
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              {getItemName()}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              ID: {entity.id}
            </Typography>
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
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Таби */}
        <Box sx={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)',
          borderRadius: 2,
          mx: 3,
          mt: 3,
          p: 1
        }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="edit form tabs"
            sx={{
              '& .MuiTab-root': {
                minHeight: 48,
                borderRadius: 2,
                mx: 0.5,
                fontWeight: 500,
                textTransform: 'none',
                fontSize: '0.875rem',
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  transform: 'translateY(-1px)',
                  transition: 'all 0.2s ease-in-out'
                },
                '&:not(.Mui-selected)': {
                  color: '#64748b',
                  '&:hover': {
                    background: 'rgba(25, 118, 210, 0.08)',
                    color: '#1976d2'
                  }
                }
              },
              '& .MuiTabs-indicator': {
                display: 'none'
              }
            }}
          >
            <Tab label="Основна інформація" />
            <Tab label="Опис українською" />
            <Tab label="Опис англійською" />
            <Tab label="Опис москальською" />
            <Tab label="Схожі об'єкти" />
          </Tabs>
        </Box>

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
        </Box>
      </DialogContent>

      <DialogActions sx={{
        p: 3,
        background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)',
        borderRadius: '0 0 12px 12px',
        borderTop: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <Button
          onClick={handleCancel}
          disabled={loading}
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.875rem',
            border: '2px solid #e2e8f0',
            color: '#64748b',
            '&:hover': {
              borderColor: '#cbd5e1',
              background: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          Скасувати
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !isFormValid()}
          startIcon={loading ? <CircularProgress size={16} /> : null}
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.875rem',
            background: isFormValid()
              ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
              : 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
            boxShadow: isFormValid()
              ? '0 4px 12px rgba(25, 118, 210, 0.3)'
              : '0 2px 4px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              background: isFormValid()
                ? 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)'
                : 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
              boxShadow: isFormValid()
                ? '0 6px 16px rgba(25, 118, 210, 0.4)'
                : '0 2px 4px rgba(0, 0, 0, 0.1)',
              transform: isFormValid() ? 'translateY(-1px)' : 'none'
            },
            '&:disabled': {
              background: '#e2e8f0',
              color: '#94a3b8'
            }
          }}
        >
          {isFormValid() ? (saveButtonText || 'Зберегти') : `${saveButtonText || 'Зберегти'} (${getFormErrors().length} помилок)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 