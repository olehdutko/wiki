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
  useMediaQuery,
  Slide,
  Fade
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
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
const DRAWER_WIDTH = 224;

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
const ENTITY_GROUPS: Array<{ title: string; entities: EntityType[] }> = [
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  // Обробник для згортання/розгортання панелі
  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
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
          py: 1,
          minHeight: '80px'
        }}
      >
        {sidebarOpen ? (
          <Fade in={sidebarOpen}>
            <Box sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mr: 1
            }}>
              <Typography
                variant="h6"
                component="div"
                align="center"
                sx={{
                  wordWrap: 'break-word',
                  whiteSpace: 'normal',
                  lineHeight: 1.2,
                  fontSize: '1.1rem',
                  maxWidth: '160px'
                }}
              >
                Енциклопедія холодної зброї
              </Typography>
            </Box>
          </Fade>
        ) : (
          <Box sx={{ width: '100%' }} />
        )}
        <IconButton
          onClick={isMobile ? handleDrawerToggle : handleSidebarToggle}
          sx={{
            display: { xs: 'none', md: 'flex' }
          }}
        >
          {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
        {isMobile && (
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ display: { md: 'none' } }}
          >
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>

      <Divider />

      {/* Статус API */}
      <Fade in={sidebarOpen}>
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
      </Fade>

      <Divider />

      {/* Список сутностей */}
      {ENTITY_GROUPS.map((group) => (
        <Box key={group.title}>
          <List subheader={
            <Fade in={sidebarOpen}>
              <Typography
                variant="overline"
                sx={{ px: 2, py: 1, color: 'text.secondary', fontWeight: 'bold' }}
              >
                {group.title}
              </Typography>
            </Fade>
          }>
            {group.entities.map((entityType: EntityType) => (
              <ListItem key={entityType} disablePadding>
                <ListItemButton
                  selected={currentEntity === entityType}
                  onClick={() => handleEntitySelect(entityType)}
                  sx={{
                    mx: 1,
                    borderRadius: 1,
                    minWidth: sidebarOpen ? 'auto' : '40px',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
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
                  <ListItemIcon sx={{ minWidth: sidebarOpen ? 40 : 'auto' }}>
                    {ENTITY_ICONS[entityType]}
                  </ListItemIcon>
                  <Fade in={sidebarOpen}>
                    <ListItemText
                      primary={getEntityDisplayName(entityType)}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: currentEntity === entityType ? 600 : 400
                      }}
                      sx={{ display: sidebarOpen ? 'block' : 'none' }}
                    />
                  </Fade>
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
          width: { md: `calc(100% - ${sidebarOpen ? DRAWER_WIDTH : 58}px)` },
          ml: { md: `${sidebarOpen ? DRAWER_WIDTH : 58}px` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
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
        </Toolbar>
      </AppBar>

      {/* Бічна навігаційна панель */}
      <Box
        component="nav"
        sx={{
          width: { md: sidebarOpen ? DRAWER_WIDTH : 58 },
          flexShrink: { md: 0 },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {/* Мобільна версія */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
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
              width: sidebarOpen ? DRAWER_WIDTH : 58,
              overflowX: 'hidden',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              position: 'fixed',
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
          width: { md: `calc(100% - ${sidebarOpen ? DRAWER_WIDTH : 58}px)` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
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
