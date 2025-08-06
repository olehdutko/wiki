/**
 * Головний компонент застосунку енциклопедії холодної зброї
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  CssBaseline,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  Alert,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Refresh as RefreshIcon,
  SportsEsports as WeaponsIcon,
  Category as CategoryIcon,
  Engineering as TypeIcon,
  Timeline as EpohaIcon,
  Security as GuardIcon,
  Architecture as BladeIcon,
  RadioButtonChecked as AppleIcon,
  Build as SharpeningIcon,
  Assignment as UsageIcon,
  Apps as DollsIcon
} from '@mui/icons-material';

import { EntityDataGrid } from './components/DataGrid/EntityDataGrid';
import type { EntityType, BaseEntity } from './types/api.types';
import { getEntityDisplayName } from './config/entities.config';
import { apiService } from './services/api.service';

// Конфігурація ширини бічної панелі
const DRAWER_WIDTH = 280;

// Іконки для кожного типу сутності
const ENTITY_ICONS: Record<EntityType, React.ReactElement> = {
  'weapons': <WeaponsIcon />,
  'categories': <CategoryIcon />,
  'global-type': <TypeIcon />,
  'epoha': <EpohaIcon />,
  'guard-type': <GuardIcon />,
  'blade-type': <BladeIcon />,
  'apple': <AppleIcon />,
  'sharpening': <SharpeningIcon />,
  'usage': <UsageIcon />,
  'dolls': <DollsIcon />
};

// Групування сутностей
const ENTITY_GROUPS = [
  {
    title: 'Головні дані',
    entities: ['weapons', 'categories']
  },
  {
    title: 'Довідкові дані',
    entities: [
      'global-type',
      'guard-type',
      'blade-type',
      'apple',
      'sharpening',
      'usage',
      'dolls',
      'epoha'
    ]
  }
];

function App() {
  // Стан
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentEntity, setCurrentEntity] = useState<EntityType>('weapons');
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Перевірка здоров'я API при завантаженні
  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const healthy = await apiService.checkHealth();
      setApiHealthy(healthy);
    } catch (error) {
      setApiHealthy(false);
    }
  };

  // Обробники подій
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleEntitySelect = (entityType: EntityType) => {
    setCurrentEntity(entityType);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleRowSelect = (row: BaseEntity) => {
    console.log('Selected row:', row);
    // TODO: Відкрити деталі в модальному вікні або навігувати до деталей
  };

  const handleRowEdit = (row: BaseEntity) => {
    console.log('Edit row:', row);
    // TODO: Відкрити форму редагування
  };

  // Рендер навігаційної панелі
  const renderDrawerContent = () => (
    <Box>
      {/* Заголовок */}
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: [1],
        }}
      >
        <Typography variant="h6" noWrap component="div">
          Енциклопедія зброї
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>

      <Divider />

      {/* Статус API */}
      <Box sx={{ p: 2 }}>
        {apiHealthy === null && (
          <Chip
            label="Перевірка API..."
            size="small"
            color="default"
            icon={<RefreshIcon />}
          />
        )}
        {apiHealthy === true && (
          <Chip
            label="API активний"
            size="small"
            color="success"
            variant="outlined"
          />
        )}
        {apiHealthy === false && (
          <Chip
            label="API недоступний"
            size="small"
            color="error"
            icon={<RefreshIcon />}
            onClick={checkApiHealth}
            clickable
          />
        )}
      </Box>

      <Divider />

      {/* Список сутностей */}
      {ENTITY_GROUPS.map((group) => (
        <Box key={group.title}>
          <List subheader={
            <Typography
              variant="overline"
              sx={{ px: 2, py: 1, color: 'text.secondary', fontWeight: 'bold' }}
            >
              {group.title}
            </Typography>
          }>
            {group.entities.map((entityType) => (
              <ListItem key={entityType} disablePadding>
                <ListItemButton
                  selected={currentEntity === entityType}
                  onClick={() => handleEntitySelect(entityType)}
                  sx={{
                    mx: 1,
                    borderRadius: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                    },
                  }}
                >
                  <ListItemIcon>
                    {ENTITY_ICONS[entityType]}
                  </ListItemIcon>
                  <ListItemText
                    primary={getEntityDisplayName(entityType)}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: currentEntity === entityType ? 600 : 400
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
        </Box>
      ))}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* Верхня панель */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {getEntityDisplayName(currentEntity)}
          </Typography>
          <IconButton color="inherit" onClick={checkApiHealth} title="Перевірити API">
            <RefreshIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Бічна навігаційна панель */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Мобільна версія */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Кращий performance на мобільних пристроях
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {renderDrawerContent()}
        </Drawer>

        {/* Десктопна версія */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {renderDrawerContent()}
        </Drawer>
      </Box>

      {/* Головний контент */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Toolbar />

        {/* Перевірка доступності API */}
        {apiHealthy === false && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              <IconButton size="small" onClick={checkApiHealth}>
                <RefreshIcon />
              </IconButton>
            }
          >
            Сервер API недоступний. Перевірте, чи запущений backend сервер на http://localhost:3001
          </Alert>
        )}

        {/* Грід даних */}
        <Container maxWidth={false} disableGutters>
          <EntityDataGrid<BaseEntity>
            entityType={currentEntity}
            onRowSelect={handleRowSelect}
            onRowEdit={handleRowEdit}
            height={700}
          />
        </Container>
      </Box>
    </Box>
  );
}

export default App;
