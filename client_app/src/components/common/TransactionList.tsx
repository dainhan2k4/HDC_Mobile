import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { Transaction } from "../../types/transaction";
import { TransactionItem } from './Transaction/TransactionItem';

interface TransactionListProps {
    transactions: Transaction[];
    isLoading?: boolean;
    onRefresh?: () => void;
    onPressItem?: (transaction: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ 
    transactions, 
    isLoading = false,
    onRefresh,
    onPressItem 
}) => {
    
    const renderListHeader = () => (
        <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Giao dịch gần đây</Text>
            
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có giao dịch nào.</Text>
        </View>
    );

    if (isLoading && (!transactions || transactions.length === 0)) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    return (
        <FlatList
            data={transactions}
            renderItem={({ item }) => (
                <TransactionItem 
                    transaction={item}
                    onPress={onPressItem}
                />
            )}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={styles.listContainer}
            refreshing={isLoading}
            onRefresh={onRefresh}
            showsVerticalScrollIndicator={false}
        />
    );
};

const styles = StyleSheet.create({
    listContainer: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    headerContainer: {
        paddingBottom: 10,
        marginBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#343a40',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#6c757d',
    },
});  