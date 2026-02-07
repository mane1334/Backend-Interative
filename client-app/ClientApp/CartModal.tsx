import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { CartItem } from './types';
import { Theme } from './themes';

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemoveItem: (id: number) => void;
  onChangeQuantity: (id: number, quantity: number) => void;
  onSendOrder: () => void;
  isSending: boolean;
  theme: Theme;
}

const CartModal: React.FC<CartModalProps> = ({ visible, onClose, cart, onRemoveItem, onChangeQuantity, onSendOrder, isSending, theme }) => {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={[styles.itemContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.name}</Text>
        <Text style={[styles.itemPrice, { color: theme.colors.success }]}>MT {parseFloat(String(item.price)).toFixed(2)}</Text>
      </View>
      <View style={[styles.quantityContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => onChangeQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} style={styles.qtyBtn}>
          <Text style={[styles.quantityButton, { color: theme.colors.primary }]}>-</Text>
        </TouchableOpacity>
        <Text style={[styles.quantityText, { color: theme.colors.text }]}>{item.quantity}</Text>
        <TouchableOpacity onPress={() => onChangeQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}>
          <Text style={[styles.quantityButton, { color: theme.colors.primary }]}>+</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => onRemoveItem(item.id)} style={styles.removeBtn}>
        <Text style={[styles.removeText, { color: theme.colors.error }]}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Meus Pedidos</Text>
          <TouchableOpacity onPress={onClose}><Text style={[styles.closeText, { color: theme.colors.primary }]}>Fechar</Text></TouchableOpacity>
        </View>

        {cart.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Seu carrinho está vazio.</Text>
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

        <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>Total</Text>
            <Text style={[styles.totalValue, { color: theme.colors.text }]}>MT {total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: theme.colors.primary },
              (cart.length === 0 || isSending) && { backgroundColor: theme.colors.secondary, opacity: 0.5 }
            ]}
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
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1 },
  title: { fontSize: 26, fontWeight: '900' },
  closeText: { fontWeight: 'bold', fontSize: 16 },
  listContainer: { padding: 20 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  itemName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  itemPrice: { fontSize: 15, fontWeight: 'bold' },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 6, borderWidth: 1 },
  qtyBtn: { padding: 10 },
  quantityButton: { fontSize: 20, fontWeight: 'bold' },
  quantityText: { fontSize: 18, marginHorizontal: 12, fontWeight: '900' },
  removeBtn: { marginLeft: 16, padding: 8 },
  removeText: { fontSize: 20, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 80, marginBottom: 24 },
  emptyText: { fontSize: 20, textAlign: 'center', fontWeight: '500' },
  footer: { padding: 24, borderTopWidth: 1, paddingBottom: 40 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  totalLabel: { fontSize: 20, fontWeight: '600' },
  totalValue: { fontSize: 28, fontWeight: '900' },
  sendButton: { paddingVertical: 18, borderRadius: 18, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, elevation: 8 },
  sendButtonText: { color: '#ffffff', fontWeight: '900', fontSize: 20 },
});

export default CartModal; 