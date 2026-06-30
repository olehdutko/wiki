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
  Fade,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Refresh as RefreshIcon,
  CloudDownload as CloudDownloadIcon,
  SportsMartialArts as WeaponsIcon,
  Folder as CategoriesIcon,
  Public as GlobalTypeIcon,
  AccessTime as EpohaIcon,
  ClearAll as GuardIcon,
  PlayArrow as BladeIcon,
  PanoramaFishEye as PommelIcon,
  AutoFixHigh as SharpeningIcon,
  Handshake as UsageIcon,
  Straighten as DollsIcon,
  Map as TerritoriesIcon
} from '@mui/icons-material';

import { EntityDataGrid } from './components/DataGrid/EntityDataGrid';
import type { EntityType, BaseEntity } from './types/api.types';
import { getEntityDisplayName } from './config/entities.config';
import { apiService } from './services/api.service';

// Конфігурація ширини бічної панелі
const DRAWER_WIDTH = 224;

// Монохромні іконки для кожного типу сутності
const ENTITY_ICONS: Record<EntityType, React.ReactElement> = {
  'weapons': <WeaponsIcon />,
  'categories': <CategoriesIcon />,
  'territories': <TerritoriesIcon />,
  'global-type': <GlobalTypeIcon />,
  'epoha': <EpohaIcon />,
  'guard-type': <GuardIcon />,
  'blade-type': <BladeIcon />,
  'pommel': <PommelIcon />,
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
      'pommel',
      'sharpening',
      'usage',
      'dolls',
      'epoha',
      'territories'
    ]
  }
];

function App() {
  // Стан
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentEntity, setCurrentEntity] = useState<EntityType>('weapons');
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const [dumpLoading, setDumpLoading] = useState(false);
  const [dumpMessage, setDumpMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [weaponsInitialFilterModel, setWeaponsInitialFilterModel] = useState<any>(undefined);
  const [weaponsInitialCategoryId, setWeaponsInitialCategoryId] = useState<number | null>(null);
  const [weaponsInitialFilterLabel, setWeaponsInitialFilterLabel] = useState<string | undefined>(undefined);

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
    if (entityType !== 'weapons') {
      setWeaponsInitialFilterModel(undefined);
      setWeaponsInitialCategoryId(null);
      setWeaponsInitialFilterLabel(undefined);
    }
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

  const handleViewRelatedItems = (payload: { entityType: 'weapons'; filterModel?: any; categoryId?: number; filterLabel?: string }) => {
    if (payload.filterModel) {
      setWeaponsInitialFilterModel(payload.filterModel);
      setWeaponsInitialCategoryId(null);
      setWeaponsInitialFilterLabel(payload.filterLabel);
    } else if (payload.categoryId) {
      setWeaponsInitialCategoryId(payload.categoryId);
      setWeaponsInitialFilterModel(undefined);
      setWeaponsInitialFilterLabel(payload.filterLabel);
    }
    setCurrentEntity('weapons');
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Обробник для згортання/розгортання панелі
  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleExportDatabase = async () => {
    setDumpMessage(null);
    setDumpLoading(true);
    try {
      await apiService.downloadDatabaseDump();
      setDumpMessage({ text: 'Файл дампу збережено', isError: false });
    } catch (e) {
      const text = e instanceof Error ? e.message : 'Не вдалося створити дамп';
      setDumpMessage({ text, isError: true });
    } finally {
      setDumpLoading(false);
    }
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

      <List subheader={
        <Fade in={sidebarOpen}>
          <Typography
            variant="overline"
            sx={{ px: 2, py: 1, color: 'text.secondary', fontWeight: 'bold' }}
          >
            База даних
          </Typography>
        </Fade>
      }>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleExportDatabase}
            disabled={apiHealthy !== true || dumpLoading}
            aria-label="Експорт бази даних (mysqldump)"
            title="Завантажити SQL-дамп через mysqldump на сервері"
            sx={{
              mx: 1,
              borderRadius: 1,
              minWidth: sidebarOpen ? 'auto' : '40px',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
            }}
          >
            <ListItemIcon sx={{ minWidth: sidebarOpen ? 40 : 'auto' }}>
              {dumpLoading ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                <CloudDownloadIcon />
              )}
            </ListItemIcon>
            <Fade in={sidebarOpen}>
              <ListItemText
                primary="Експорт БД (dump)"
                secondary="mysqldump"
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
                sx={{ display: sidebarOpen ? 'block' : 'none' }}
              />
            </Fade>
          </ListItemButton>
        </ListItem>
      </List>
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
            key={currentEntity}
            entityType={currentEntity}
            onRowSelect={handleRowSelect}
            onRowEdit={handleRowEdit}
            onViewRelatedItems={handleViewRelatedItems}
            initialFilterModel={currentEntity === 'weapons' ? weaponsInitialFilterModel : undefined}
            initialCategoryId={currentEntity === 'weapons' ? weaponsInitialCategoryId : undefined}
            initialFilterLabel={currentEntity === 'weapons' ? weaponsInitialFilterLabel : undefined}
            height={700}
          />
        </Container>
      </Box>

      <Snackbar
        open={dumpMessage !== null}
        autoHideDuration={dumpMessage?.isError ? 8000 : 4000}
        onClose={() => setDumpMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {dumpMessage ? (
          <Alert
            onClose={() => setDumpMessage(null)}
            severity={dumpMessage.isError ? 'error' : 'success'}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {dumpMessage.text}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}

export default App;
