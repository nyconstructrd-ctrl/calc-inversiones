import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Linking, FlatList, Modal } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LinkingExpo from 'expo-linking';

const Tab = createBottomTabNavigator();

const STORAGE_KEYS = {
  CONFIG: '@calc_config',
  COMPRAS: '@calc_compras',
  VENTAS: '@calc_ventas',
};

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
            else if (route.name === 'Config') iconName = focused ? 'settings' : 'settings-outline';
            else if (route.name === 'Compras') iconName = focused ? 'cart' : 'cart-outline';
            else if (route.name === 'Ventas') iconName = focused ? 'cash' : 'cash-outline';
            else if (route.name === 'Historial') iconName = focused ? 'archive' : 'archive-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#4CAF50',
          tabBarInactiveTintColor: 'gray',
          headerStyle: { backgroundColor: '#4CAF50' },
          headerTintColor: 'white',
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Resumen' }} />
        <Tab.Screen name="Config" component={ConfigScreen} options={{ title: 'Datos del Comercio' }} />
        <Tab.Screen name="Compras" component={ComprasScreen} options={{ title: 'Registro de Compras' }} />
        <Tab.Screen name="Ventas" component={VentasScreen} options={{ title: 'Registro de Ventas' }} />
        <Tab.Screen name="Historial" component={HistorialScreen} options={{ title: 'Historial y Respaldo' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function DashboardScreen() {
  const [config, setConfig] = useState(null);
  const [compras, setCompras] = useState([]);
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const cfg = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG);
      const com = await AsyncStorage.getItem(STORAGE_KEYS.COMPRAS);
      const ven = await AsyncStorage.getItem(STORAGE_KEYS.VENTAS);
      if (cfg) setConfig(JSON.parse(cfg));
      if (com) setCompras(JSON.parse(com));
      if (ven) setVentas(JSON.parse(ven));
    } catch (e) { console.log(e); }
  };

  if (!config) {
    return (
      <View style={styles.container}>
        <Card title="⚠️ Configuración Requerida" description="Ve a la pestaña Config y establece los datos de tu comercio" />
      </View>
    );
  }

  const mesActual = new Date().toLocaleString('default', { month: 'long' });
  
  const ventasDelMes = ventas.filter(v => {
    const fecha = new Date(v.fecha);
    return fecha.getMonth() === new Date().getMonth() && fecha.getFullYear() === new Date().getFullYear();
  });

  const ventaTotal = ventasDelMes.reduce((sum, v) => sum + v.precioVenta, 0);
  const inversionPrendas = ventasDelMes.reduce((sum, v) => sum + v.costoPrenda, 0);
  const publicidad = config.publicidadMensual || 0;
  const diezmoRegistrado = ventasDelMes.reduce((sum, v) => sum + (v.diezmo || 0), 0);

  const utilidadBruta = ventaTotal - inversionPrendas;
  const diezmoCalculado = Math.max(0, utilidadBruta * 0.1);
  
  const restoPorVender = compras
    .filter(c => !c.vendido)
    .reduce((sum, c) => sum + c.costoTotalLocal, 0);

  const inversionTotal = compras.reduce((sum, c) => sum + c.costoTotalLocal, 0);
  const inversionMes = compras.filter(c => {
    const fecha = new Date(c.fecha);
    return fecha.getMonth() === new Date().getMonth() && fecha.getFullYear() === new Date().getFullYear();
  }).reduce((sum, c) => sum + c.costoTotalLocal, 0);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.tituloSeccion}>📊 {mesActual.charAt(0).toUpperCase() + mesActual.slice(1)}</Text>
      
      <Card 
        title="💰 Venta Total del Mes" 
        value={`$${ventaTotal.toLocaleString()}`} 
        color="#4CAF50" 
      />
      
      <Card 
        title="📦 Inversión Realizada" 
        value={`$${inversionMes.toLocaleString()}`}
        subtitle={`Total historial: $${inversionTotal.toLocaleString()}`}
        color="#2196F3" 
      />
      
      <Card 
        title="🙏 Diezmo (10% Utilidad)" 
        value={`$${diezmoCalculado.toLocaleString()}`}
        subtitle={`Registrado: $${diezmoRegistrado.toLocaleString()}`}
        color="#FF9800" 
      />
      
      <Card 
        title="💵 Utilidad Neta" 
        value={`$${(ventaTotal - inversionMes - publicidad - diezmoCalculado).toLocaleString()}`}
        subtitle={`Inv: $${inversionMes} | Pub: $${publicidad} | Diezmo: $${diezmoCalculado.toFixed(0)}`}
        color={ventaTotal - inversionMes - publicidad - diezmoCalculado >= 0 ? '#4CAF50' : '#f44336'}
      />
      
      <Card 
        title="👗 Resto por Vender" 
        value={`$${restoPorVender.toLocaleString()}`}
        subtitle={`${compras.filter(c => !c.vendido).length} prendas sin vender`}
        color="#9C27B0" 
      />

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function ConfigScreen() {
  const [config, setConfig] = useState({ costoPorLibra: '', publicidadMensual: 0, tasaCambio: '' });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG);
      if (data) setConfig(JSON.parse(data));
    } catch (e) { console.log(e); }
  };

  const saveConfig = async () => {
    if (!config.costoPorLibra || !config.tasaCambio) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
      Alert.alert('✅ Guardado', 'Configuración guardada correctamente');
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.tituloSeccion}>⚙️ Configuración del Comercio</Text>
      
      <Card title="Costo por Libra (USD)" description="Costo de envío por libra">
        <TextInput
          style={styles.input}
          value={config.costoPorLibra}
          onChangeText={(t) => setConfig({ ...config, costoPorLibra: t })}
          keyboardType="numeric"
          placeholder="Ej: 5"
        />
      </Card>

      <Card title="Tasa de Cambio" description="1 USD = ? (moneda local)">
        <TextInput
          style={styles.input}
          value={config.tasaCambio}
          onChangeText={(t) => setConfig({ ...config, tasaCambio: t })}
          keyboardType="numeric"
          placeholder="Ej: 3500"
        />
      </Card>

      <Card title="Publicidad Mensual Fija" description="Monto mensual de publicidad">
        <TextInput
          style={styles.input}
          value={String(config.publicidadMensual)}
          onChangeText={(t) => setConfig({ ...config, publicidadMensual: Number(t) || 0 })}
          keyboardType="numeric"
          placeholder="Ej: 50000"
        />
      </Card>

      <Card title="Diezmo" description="10% de la utilidad bruta (automático)">
        <Text style={styles.infoText}>10% - Se descuenta automáticamente al vender</Text>
      </Card>

      <TouchableOpacity style={styles.botonGrande} onPress={saveConfig}>
        <Text style={styles.botonGrandeText}>💾 Guardar Configuración</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function ComprasScreen() {
  const [config, setConfig] = useState(null);
  const [compras, setCompras] = useState([]);
  const [form, setForm] = useState({ proveedor: 'Shein', costoUSD: '', pesoLibras: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const cfg = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG);
      const com = await AsyncStorage.getItem(STORAGE_KEYS.COMPRAS);
      if (cfg) setConfig(JSON.parse(cfg));
      if (com) setCompras(JSON.parse(com));
    } catch (e) { console.log(e); }
  };

  const guardarCompra = async () => {
    if (!config) {
      Alert.alert('Error', 'Primero configura los datos del comercio');
      return;
    }
    if (!form.costoUSD || !form.pesoLibras) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    const costoUSD = parseFloat(form.costoUSD);
    const pesoLibras = parseFloat(form.pesoLibras);
    const tasa = parseFloat(config.tasaCambio);
    const costoEnvioLibra = parseFloat(config.costoPorLibra);
    
    const costoEnvioTotal = pesoLibras * costoEnvioLibra;
    const costoPrendaLocal = costoUSD * tasa;
    const costoTotalLocal = costoPrendaLocal + costoEnvioTotal;

    const nuevaCompra = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      proveedor: form.proveedor,
      costoUSD,
      pesoLibras,
      costoEnvioTotal: costoEnvioTotal * tasa,
      costoPrendaLocal,
      costoTotalLocal,
      vendido: false
    };

    const updated = [...compras, nuevaCompra];
    setCompras(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.COMPRAS, JSON.stringify(updated));
    
    setForm({ proveedor: 'Shein', costoUSD: '', pesoLibras: '' });
    setShowForm(false);
    Alert.alert('✅ Compras', `Inversión: $${costoTotalLocal.toLocaleString()}`);
  };

  const eliminarCompra = async (id) => {
    Alert.alert('Eliminar', '¿Eliminar esta compra?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        const updated = compras.filter(c => c.id !== id);
        setCompras(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.COMPRAS, JSON.stringify(updated));
      }}
    ]);
  };

  const comprasNoVendidas = compras.filter(c => !c.vendido);

  return (
    <ScrollView style={styles.container}>
      {!showForm ? (
        <>
          <TouchableOpacity style={styles.botonGrande} onPress={() => setShowForm(true)}>
            <Text style={styles.botonGrandeText}>➕ Registrar Compra</Text>
          </TouchableOpacity>

          <Text style={styles.tituloSeccion}>📦 Compras Pendientes ({comprasNoVendidas.length})</Text>
          
          {comprasNoVendidas.length === 0 ? (
            <Card title="Sin compras" description="Registra tu primera compra" />
          ) : (
            comprasNoVendidas.map(c => (
              <Card 
                key={c.id}
                title={`${c.proveedor} - $${c.costoTotalLocal.toLocaleString()}`}
                description={`${c.pesoLibras} lbs | Envío: $${c.costoEnvioTotal.toLocaleString()} | ${new Date(c.fecha).toLocaleDateString()}`}
                onDelete={() => eliminarCompra(c.id)}
              />
            ))
          )}
        </>
      ) : (
        <>
          <Text style={styles.tituloSeccion}>🛒 Nueva Compra</Text>
          
          <Card title="Proveedor">
            {['Shein', 'Fashion Nova', 'Por fuera'].map(p => (
              <TouchableOpacity 
                key={p}
                style={[styles.opcion, form.proveedor === p && styles.opcionActiva]}
                onPress={() => setForm({ ...form, proveedor: p })}
              >
                <Text style={[styles.opcionText, form.proveedor === p && styles.opcionTextActiva]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </Card>

          <Card title="Costo en Dólares (USD)">
            <TextInput
              style={styles.input}
              value={form.costoUSD}
              onChangeText={(t) => setForm({ ...form, costoUSD: t })}
              keyboardType="numeric"
              placeholder="Ej: 25.00"
            />
          </Card>

          <Card title="Peso en Libras">
            <TextInput
              style={styles.input}
              value={form.pesoLibras}
              onChangeText={(t) => setForm({ ...form, pesoLibras: t })}
              keyboardType="numeric"
              placeholder="Ej: 2.5"
            />
            {config && form.pesoLibras && (
              <Text style={styles.infoText}>
                Costo envío: ${(parseFloat(form.pesoLibras) * (config.costoPorLibra || 0) * config.tasaCambio).toLocaleString()}
              </Text>
            )}
          </Card>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[styles.botonGrande, { flex: 1, backgroundColor: '#9E9E9E' }]} onPress={() => setShowForm(false)}>
              <Text style={styles.botonGrandeText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.botonGrande, { flex: 1 }]} onPress={guardarCompra}>
              <Text style={styles.botonGrandeText}>💾 Guardar</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function VentasScreen() {
  const [config, setConfig] = useState(null);
  const [compras, setCompras] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ compraId: '', precioVenta: '', telefono: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const cfg = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG);
      const com = await AsyncStorage.getItem(STORAGE_KEYS.COMPRAS);
      const ven = await AsyncStorage.getItem(STORAGE_KEYS.VENTAS);
      if (cfg) setConfig(JSON.parse(cfg));
      if (com) setCompras(JSON.parse(com));
      if (ven) setVentas(JSON.parse(ven));
    } catch (e) { console.log(e); }
  };

  const guardarVenta = async () => {
    if (!config) {
      Alert.alert('Error', 'Primero configura los datos del comercio');
      return;
    }
    if (!form.compraId || !form.precioVenta) {
      Alert.alert('Error', 'Selecciona una prenda y precio de venta');
      return;
    }

    const compra = compras.find(c => c.id === parseInt(form.compraId));
    const precioVenta = parseFloat(form.precioVenta);
    const costoPrenda = compra.costoTotalLocal;
    const utilidadBruta = precioVenta - costoPrenda;
    const diezmo = Math.max(0, utilidadBruta * 0.1);

    const nuevaVenta = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      compraId: compra.id,
      proveedor: compra.proveedor,
      costoPrenda,
      precioVenta,
      diezmo,
      telefono: form.telefono
    };

    const updatedVentas = [...ventas, nuevaVenta];
    setVentas(updatedVentas);
    await AsyncStorage.setItem(STORAGE_KEYS.VENTAS, JSON.stringify(updatedVentas));

    const updatedCompras = compras.map(c => 
      c.id === compra.id ? { ...c, vendido: true } : c
    );
    setCompras(updatedCompras);
    await AsyncStorage.setItem(STORAGE_KEYS.COMPRAS, JSON.stringify(updatedCompras));

    setForm({ compraId: '', precioVenta: '', telefono: '' });
    setShowForm(false);
    Alert.alert('✅ Venta Registrada', `Ganancia: $${(precioVenta - costoPrenda - diezmo).toLocaleString()}`);
  };

  const abrirWhatsApp = (telefono, venta) => {
    if (!telefono) {
      Alert.alert('Info', 'Ingresa un número de teléfono para usar WhatsApp');
      return;
    }
    const mensaje = `🧾 *FACTURA*\n\n*Proveedor:* ${venta.proveedor}\n*Costo:* $${venta.costoPrenda.toLocaleString()}\n*Venta:* $${venta.precioVenta.toLocaleString()}\n*Diezmo (10%):* $${venta.diezmo.toLocaleString()}\n*Ganancia:* $${(venta.precioVenta - venta.costoPrenda - venta.diezmo).toLocaleString()}`;
    const url = `whatsapp://send?text=${encodeURIComponent(mensaje)}&phone=${telefono.replace(/\D/g, '')}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`);
    });
  };

  const comprasNoVendidas = compras.filter(c => !c.vendido);
  const ventasRecientes = [...ventas].reverse().slice(0, 10);

  return (
    <ScrollView style={styles.container}>
      {!showForm ? (
        <>
          <TouchableOpacity style={styles.botonGrande} onPress={() => setShowForm(true)}>
            <Text style={styles.botonGrandeText}>💵 Registrar Venta</Text>
          </TouchableOpacity>

          <Text style={styles.tituloSeccion}>📋 Ventas Recientes</Text>
          
          {ventasRecientes.length === 0 ? (
            <Card title="Sin ventas" description="Registra tu primera venta" />
          ) : (
            ventasRecientes.map(v => (
              <Card 
                key={v.id}
                title={`${v.proveedor} - Vendida: $${v.precioVenta.toLocaleString()}`}
                description={`Costo: $${v.costoPrenda.toLocaleString()} | Ganancia: $${(v.precioVenta - v.costoPrenda - v.diezmo).toLocaleString()} | ${new Date(v.fecha).toLocaleDateString()}`}
                actions={
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <TextInput
                      style={[styles.input, { flex: 1, height: 40 }]}
                      placeholder="Número WhatsApp"
                      value={v.telefono || form.telefono}
                      onChangeText={(t) => {
                        setVentas(ventas.map(ven => ven.id === v.id ? { ...ven, telefono: t } : ven));
                        AsyncStorage.setItem(STORAGE_KEYS.VENTAS, JSON.stringify(ventas.map(ven => ven.id === v.id ? { ...ven, telefono: t } : ven)));
                      }}
                      keyboardType="phone-pad"
                    />
                    <TouchableOpacity style={styles.botonWhatsApp} onPress={() => abrirWhatsApp(v.telefono || form.telefono, v)}>
                      <Text style={styles.botonWhatsAppText}>📱 WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                }
              />
            ))
          )}
        </>
      ) : (
        <>
          <Text style={styles.tituloSeccion}>💰 Nueva Venta</Text>
          
          <Card title="Seleccionar Prenda">
            {comprasNoVendidas.length === 0 ? (
              <Text style={styles.infoText}>No hay prendas disponibles</Text>
            ) : (
              comprasNoVendidas.map(c => (
                <TouchableOpacity 
                  key={c.id}
                  style={[styles.opcion, form.compraId === String(c.id) && styles.opcionActiva]}
                  onPress={() => setForm({ ...form, compraId: String(c.id) })}
                >
                  <Text style={[styles.opcionText, form.compraId === String(c.id) && styles.opcionTextActiva]}>
                    {c.proveedor} - $${c.costoTotalLocal.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </Card>

          <Card title="Precio de Venta">
            <TextInput
              style={styles.input}
              value={form.precioVenta}
              onChangeText={(t) => setForm({ ...form, precioVenta: t })}
              keyboardType="numeric"
              placeholder="Ej: 150000"
            />
            {form.compraId && form.precioVenta && (
              (() => {
                const compra = compras.find(c => c.id === parseInt(form.compraId));
                if (!compra) return null;
                const utilidad = parseFloat(form.precioVenta) - compra.costoTotalLocal;
                const diezmo = Math.max(0, utilidad * 0.1);
                return (
                  <Text style={styles.infoText}>
                    Ganancia: ${(utilidad - diezmo).toLocaleString()} | Diezmo: ${diezmo.toLocaleString()}
                  </Text>
                );
              })()
            )}
          </Card>

          <Card title="Teléfono del Cliente (opcional)">
            <TextInput
              style={styles.input}
              value={form.telefono}
              onChangeText={(t) => setForm({ ...form, telefono: t })}
              keyboardType="phone-pad"
              placeholder="Ej: 3001234567"
            />
          </Card>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[styles.botonGrande, { flex: 1, backgroundColor: '#9E9E9E' }]} onPress={() => setShowForm(false)}>
              <Text style={styles.botonGrandeText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.botonGrande, { flex: 1 }]} onPress={guardarVenta}>
              <Text style={styles.botonGrandeText}>✅ Marcar Vendida</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function HistorialScreen() {
  const [compras, setCompras] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [config, setConfig] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(null);
  const [showMeses, setShowMeses] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const cfg = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG);
      const com = await AsyncStorage.getItem(STORAGE_KEYS.COMPRAS);
      const ven = await AsyncStorage.getItem(STORAGE_KEYS.VENTAS);
      if (cfg) setConfig(JSON.parse(cfg));
      if (com) setCompras(JSON.parse(com));
      if (ven) setVentas(JSON.parse(ven));
    } catch (e) { console.log(e); }
  };

  const obtenerMeses = () => {
    const meses = new Set();
    [...compras, ...ventas].forEach(item => {
      const fecha = new Date(item.fecha);
      meses.add(`${fecha.getFullYear()}-${fecha.getMonth()}`);
    });
    return Array.from(meses).sort().reverse();
  };

  const generarReporte = () => {
    const meses = obtenerMeses();
    let reporte = '═══════════════════════════════════\n';
    reporte += '   RESUMEN FINANCIERO - NEGOCIO ROPA\n';
    reporte += '═══════════════════════════════════\n\n';
    
    if (config) {
      reporte += `📊 CONFIGURACIÓN:\n`;
      reporte += `- Costo por libra: $${config.costoPorLibra}\n`;
      reporte += `- Tasa cambio: ${config.tasaCambio}\n`;
      reporte += `- Publicidad mensual: $${config.publicidadMensual}\n\n`;
    }

    meses.forEach(mes => {
      const [anio, mesNum] = mes.split('-');
      const mesNombre = new Date(anio, parseInt(mesNum)).toLocaleString('default', { month: 'long', year: 'numeric' });
      
      const ventasMes = ventas.filter(v => {
        const fecha = new Date(v.fecha);
        return fecha.getMonth() === parseInt(mesNum) && fecha.getFullYear() === parseInt(anio);
      });
      
      const comprasMes = compras.filter(c => {
        const fecha = new Date(c.fecha);
        return fecha.getMonth() === parseInt(mesNum) && fecha.getFullYear() === parseInt(anio);
      });

      const ventaTotal = ventasMes.reduce((sum, v) => sum + v.precioVenta, 0);
      const inversionMes = comprasMes.reduce((sum, c) => sum + c.costoTotalLocal, 0);
      const diezmoTotal = ventasMes.reduce((sum, v) => sum + v.diezmo, 0);
      const publicidad = config?.publicidadMensual || 0;
      const utilidad = ventaTotal - inversionMes - publicidad - diezmoTotal;

      reporte += `📅 ${mesNombre.toUpperCase()}:\n`;
      reporte += `   Ventas: $${ventaTotal.toLocaleString()}\n`;
      reporte += `   Inversión: $${inversionMes.toLocaleString()}\n`;
      reporte += `   Diezmo: $${diezmoTotal.toLocaleString()}\n`;
      reporte += `   Publicidad: $${publicidad.toLocaleString()}\n`;
      reporte += `   ─────────────────────\n`;
      reporte += `   UTILIDAD: $${utilidad.toLocaleString()}\n\n`;
    });

    reporte += '═══════════════════════════════════\n';
    reporte += `Total prendas compradas: ${compras.length}\n`;
    reporte += `Total ventas: ${ventas.length}\n`;
    reporte += `Fecha respaldo: ${new Date().toLocaleDateString()}\n`;
    reporte += '═══════════════════════════════════';

    return reporte;
  };

  const meses = obtenerMeses();
  const datosMes = mesSeleccionado ? (() => {
    const [anio, mesNum] = mesSeleccionado.split('-');
    const ventasMes = ventas.filter(v => {
      const fecha = new Date(v.fecha);
      return fecha.getMonth() === parseInt(mesNum) && fecha.getFullYear() === parseInt(anio);
    });
    const comprasMes = compras.filter(c => {
      const fecha = new Date(c.fecha);
      return fecha.getMonth() === parseInt(mesNum) && fecha.getFullYear() === parseInt(anio);
    });
    return { ventasMes, comprasMes };
  })() : null;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.tituloSeccion}>📁 Historial Mensual</Text>

      <TouchableOpacity style={styles.botonGrande} onPress={() => setShowMeses(!showMeses)}>
        <Text style={styles.botonGrandeText}>📅 {mesSeleccionado ? new Date(mesSeleccionado.split('-')[0], mesSeleccionado.split('-')[1]).toLocaleString('default', { month: 'long', year: 'numeric' }) : 'Seleccionar Mes'}</Text>
      </TouchableOpacity>

      {showMeses && (
        <Card title="Meses Disponibles">
          {meses.length === 0 ? (
            <Text style={styles.infoText}>Sin datos registrados</Text>
          ) : (
            meses.map(mes => {
              const [anio, mesNum] = mes.split('-');
              const mesNombre = new Date(anio, parseInt(mesNum)).toLocaleString('default', { month: 'long', year: 'numeric' });
              return (
                <TouchableOpacity 
                  key={mes}
                  style={[styles.opcion, mesSeleccionado === mes && styles.opcionActiva]}
                  onPress={() => { setMesSeleccionado(mes); setShowMeses(false); }}
                >
                  <Text style={[styles.opcionText, mesSeleccionado === mes && styles.opcionTextActiva]}>{mesNombre}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </Card>
      )}

      {datosMes && (
        <>
          <Card 
            title="Ventas del Mes" 
            value={"$" + datosMes.ventasMes.reduce((s, v) => s + v.precioVenta, 0).toLocaleString()}
            description={datosMes.ventasMes.length + " ventas"}
            color="#4CAF50"
          />
          <Card 
            title="Inversión del Mes" 
            value={"$" + datosMes.comprasMes.reduce((s, c) => s + c.costoTotalLocal, 0).toLocaleString()}
            description={datosMes.comprasMes.length + " compras"}
            color="#2196F3"
          />
        </>
      )}

      <Text style={styles.tituloSeccion}>💾 Respaldo</Text>
      
      <TouchableOpacity style={styles.botonGrande} onPress={() => {
        const reporte = generarReporte();
        Alert.alert('📋 Respaldo Generado', 'Copia el reporte desde el botón de abajo', [
          { text: 'Generar texto', onPress: () => {
            Alert.alert('📋 COPIA ESTO:', reporte, [{ text: 'OK' }]);
          }}
        ]);
      }}>
        <Text style={styles.botonGrandeText}>📋 Generar Respaldo</Text>
      </TouchableOpacity>

      <Card title="Información">
        <Text style={styles.infoText}>
          El respaldo contiene un resumen de todos los meses con inversiones, ventas, diezmos y utilidades.
        </Text>
      </Card>
    </ScrollView>
  );
}

function Card({ title, value, description, children, onDelete, color, actions }) {
  return (
    <View style={[styles.card, color && { borderLeftColor: color, borderLeftWidth: 4 }]}>
      {(title || value) && (
        <View style={styles.cardHeader}>
          {title && <Text style={styles.cardTitle}>{title}</Text>}
          {value && <Text style={[styles.cardValue, color && { color }]}>{value}</Text>}
        </View>
      )}
      {description && <Text style={styles.cardDescription}>{description}</Text>}
      {children && <View style={{ marginTop: 10 }}>{children}</View>}
      {actions && <View style={{ marginTop: 10 }}>{actions}</View>}
      {onDelete && (
        <TouchableOpacity style={styles.botonEliminar} onPress={onDelete}>
          <Text style={styles.botonEliminarText}>🗑️ Eliminar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 15,
  },
  tituloSeccion: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 15,
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  botonGrande: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 10,
  },
  botonGrandeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  botonWhatsApp: {
    backgroundColor: '#25D366',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  botonWhatsAppText: {
    color: 'white',
    fontWeight: 'bold',
  },
  botonEliminar: {
    marginTop: 10,
    padding: 8,
    alignItems: 'center',
  },
  botonEliminarText: {
    color: '#f44336',
  },
  opcion: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
  },
  opcionActiva: {
    backgroundColor: '#4CAF50',
  },
  opcionText: {
    fontSize: 16,
    color: '#333',
  },
  opcionTextActiva: {
    color: 'white',
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});