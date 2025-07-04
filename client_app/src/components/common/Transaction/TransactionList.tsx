import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { Transaction } from "../../../types/transaction";
import { TransactionItem } from './TransactionItem';

interface TransactionListProps {
    transactions: Transaction[];
    isLoading?: boolean;
    onRefresh?: () => void;
    onPressItem?: (transaction: Transaction) => void;
    ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
    ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
}

export const TransactionList: React.FC<TransactionListProps> = ({ 
    transactions, 
    isLoading = false,
    onRefresh,
    onPressItem,
    ListHeaderComponent,
    ListFooterComponent,
}) => {
    
    const renderInternalListHeader = () => (
        <View style={styles.internalHeaderContainer}>
            <Text style={styles.headerTitle}>Giao dịch gần nhất</Text>
        </View>
    );

    const CombinedHeader = () => {
        return (
            <>
                {ListHeaderComponent}
                {renderInternalListHeader()}
            </>
        )
    };

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
                <View style={styles.itemContainer}>
                    <TransactionItem 
                        transaction={item}
                        onPress={onPressItem}
                    />
                </View>
            )}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={CombinedHeader}
            ListFooterComponent={ListFooterComponent}
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
    },
    internalHeaderContainer: {
        paddingBottom: 10,
        marginBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        paddingHorizontal: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#343a40',
    },
    itemContainer: {
        paddingHorizontal: 16,
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