import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, SafeAreaView } from 'react-native';

const CartModal = ({ visible, onClose, cart, onRemoveItem, onChangeQuantity, onSendOrder, isSending }) => {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>MT {parseFloat(item.price).toFixed(2)}</Text>
      </View>
      <View style={styles.quantityContainer}>
        <TouchableOpacity onPress={() => onChangeQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} style={styles.qtyBtn}>
          <Text style={styles.quantityButton}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity onPress={() => onChangeQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}>
          <Text style={styles.quantityButton}>+</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => onRemoveItem(item.id)} style={styles.removeBtn}>
        <Text style={styles.removeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Carrinho</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>Fechar</Text></TouchableOpacity>
        </View>

        {cart.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyText}>Seu carrinho está vazio.</Text>
          </View>
        ) : (
          <FlatList
            data={cart}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>MT {total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.sendButton, (cart.length === 0 || isSending) && styles.disabledButton]}
            onPress={onSendOrder}
            disabled={cart.length === 0 || isSending}
          >
            <Text style={styles.sendButtonText}>{isSending ? 'Enviando...' : 'Finalizar Pedido'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderColor: '#1e293b', backgroundColor: '#0f172a' },
  title: { fontSize: 26, fontWeight: '900', color: '#f8fafc' },
  closeText: { color: '#2563eb', fontWeight: 'bold', fontSize: 16 },
  listContainer: { padding: 20 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  itemName: { fontSize: 18, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 4 },
  itemPrice: { fontSize: 15, color: '#10b981', fontWeight: 'bold' },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#020617', borderRadius: 14, paddingHorizontal: 6, borderWidth: 1, borderColor: '#334155' },
  qtyBtn: { padding: 10 },
  quantityButton: { fontSize: 20, color: '#3b82f6', fontWeight: 'bold' },
  quantityText: { fontSize: 18, color: '#f8fafc', marginHorizontal: 12, fontWeight: '900' },
  removeBtn: { marginLeft: 16, padding: 8 },
  removeText: { color: '#ef4444', fontSize: 20, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 80, marginBottom: 24 },
  emptyText: { color: '#94a3b8', fontSize: 20, textAlign: 'center', fontWeight: '500' },
  footer: { padding: 24, borderTopWidth: 1, borderColor: '#1e293b', backgroundColor: '#0f172a', paddingBottom: 40 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  totalLabel: { color: '#94a3b8', fontSize: 20, fontWeight: '600' },
  totalValue: { color: '#f8fafc', fontSize: 28, fontWeight: '900' },
  sendButton: { backgroundColor: '#2563eb', paddingVertical: 18, borderRadius: 18, alignItems: 'center', shadowColor: '#2563eb', shadowOpacity: 0.4, shadowRadius: 15, elevation: 8 },
  sendButtonText: { color: '#ffffff', fontWeight: '900', fontSize: 20 },
  disabledButton: { backgroundColor: '#1e293b', opacity: 0.5 },
});

export default CartModal; 