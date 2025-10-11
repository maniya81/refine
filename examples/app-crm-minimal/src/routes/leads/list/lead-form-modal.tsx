import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Typography,
  Space,
  Button,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useModalForm, useSelect } from "@refinedev/antd";
import { useGetIdentity, useCreate } from "@refinedev/core";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Title } = Typography;

type LeadFormModalProps = {
  action: "create" | "edit";
  opened: boolean;
  onClose: () => void;
  leadId?: string;
};

const StageEnum = [
  { value: "Raw", label: "Raw (Unqualified)" },
  { value: "New", label: "New" },
  { value: "Discussion", label: "Discussion" },
  { value: "Demo", label: "Demo" },
  { value: "Proposal", label: "Proposal" },
  { value: "Decided", label: "Decided" },
  { value: "Rejected", label: "Rejected" },
];

export const LeadFormModal: React.FC<LeadFormModalProps> = ({
  action,
  opened,
  onClose,
  leadId,
}) => {
  const [showNewProductInput, setShowNewProductInput] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  const [showNewSourceInput, setShowNewSourceInput] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  const [isCreatingSource, setIsCreatingSource] = useState(false);

  const { data: identity, isLoading: identityLoading } = useGetIdentity<{
    id: string;
  }>();

  const { mutate: createProduct } = useCreate();
  const { mutate: createSource } = useCreate();

  const { formProps, modalProps, form } = useModalForm({
    resource: "lead",
    action: action,
    id: leadId,
    redirect: false,
    onMutationSuccess: () => {
      form.resetFields();
      onClose();
    },
  });

  console.log("LeadFormModal - opened:", opened, "identity:", identity);

  const { selectProps: sourceSelectProps, query: sourceQuery } = useSelect({
    resource: "source",
    optionLabel: "name",
    optionValue: "id",
    pagination: {
      pageSize: 100,
    },
    queryOptions: {
      enabled: opened,
    },
  });

  const handleCreateSource = () => {
    if (!newSourceName.trim()) return;

    setIsCreatingSource(true);
    createSource(
      {
        resource: "source",
        values: {
          name: newSourceName.trim(),
        },
      },
      {
        onSuccess: (data) => {
          form.setFieldValue("source_id", data.data.id);
          setNewSourceName("");
          setShowNewSourceInput(false);
          setIsCreatingSource(false);
          sourceQuery?.refetch();
        },
        onError: (error) => {
          console.error("Error creating source:", error);
          setIsCreatingSource(false);
        },
      },
    );
  };

  const { selectProps: productSelectProps, query: productQuery } = useSelect({
    resource: "product",
    optionLabel: "name",
    optionValue: "id",
    pagination: {
      pageSize: 100,
    },
    queryOptions: {
      enabled: opened,
    },
  });

  const handleCreateProduct = () => {
    if (!newProductName.trim()) return;

    setIsCreatingProduct(true);
    createProduct(
      {
        resource: "product",
        values: {
          name: newProductName.trim(),
        },
      },
      {
        onSuccess: (data) => {
          // Set the newly created product as the selected value
          form.setFieldValue("product_id", data.data.id);
          setNewProductName("");
          setShowNewProductInput(false);
          setIsCreatingProduct(false);
          // Refetch products to update the dropdown
          productQuery?.refetch();
        },
        onError: (error) => {
          console.error("Error creating product:", error);
          setIsCreatingProduct(false);
        },
      },
    );
  };

  // Transform data when editing - flatten business fields
  useEffect(() => {
    if (action === "edit" && form) {
      const formData = form.getFieldsValue() as any;
      if (formData?.business) {
        form.setFieldsValue({
          ...formData,
          business_name: formData.business.business,
          contact_person: formData.business.name,
          title: formData.business.title,
          designation: formData.business.designation,
          mobile: formData.business.mobile,
          email: formData.business.email,
          website: formData.business.website,
          address: formData.business.address_line_1,
          address_line2: formData.business.address_line_2,
          city: formData.business.city,
          country: formData.business.country,
          GSTIN: formData.business.gstin,
          code: formData.business.code,
        });
      }
      if (formData?.since) {
        form.setFieldValue("since", dayjs(formData.since));
      }
    }
  }, [action, form]);

  const handleModalClose = () => {
    form?.resetFields();
    onClose();
  };

  return (
    <Modal
      {...modalProps}
      open={opened}
      onCancel={handleModalClose}
      title={action === "create" ? "Create Lead" : "Edit Lead"}
      width={900}
      style={{ top: 20 }}
      okText={action === "create" ? "Create" : "Save"}
      cancelText="Cancel"
    >
      <Form
        {...formProps}
        layout="vertical"
        onFinish={(values: any) => {
          console.log("Form onFinish called with values:", values);
          console.log("Identity ID:", identity?.id);

          // Transform flat form values into nested business structure
          const leadData = {
            ...values,
            assigned_to: identity?.id, // Auto-assign to logged-in user
            tags: values.tags || [], // Ensure tags is an array (API expects Set)
            business: {
              business: values.business_name || "",
              name: values.contact_person || "",
              title: values.title || null,
              designation: values.designation || "",
              mobile: values.mobile || "",
              email: values.email || "",
              website: values.website || "",
              address_line_1: values.address || "",
              address_line_2: values.address_line2 || "",
              city: values.city || "",
              country: values.country || "",
              gstin: values.GSTIN || "",
              code: values.code || "",
            },
            since: values.since
              ? values.since.toISOString()
              : new Date().toISOString(),
          };

          // Remove the flat business fields from root level
          const {
            business_name,
            contact_person,
            title,
            designation,
            mobile,
            email,
            website,
            address,
            address_line2,
            city,
            country,
            GSTIN,
            code,
            ...restValues
          } = leadData;

          const finalData = { ...restValues, business: leadData.business };
          console.log("Final data to submit:", finalData);

          formProps?.onFinish?.(finalData);
        }}
      >
        <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
          Business Information
        </Title>

        <Form.Item
          label="Business Name"
          name="business_name"
          rules={[{ required: true, message: "Please enter business name" }]}
        >
          <Input placeholder="Enter business name" />
        </Form.Item>

        <Form.Item
          label="Contact Person"
          name="contact_person"
          rules={[{ required: true, message: "Please enter contact person" }]}
        >
          <Input placeholder="Enter contact person" />
        </Form.Item>

        <Form.Item label="Title" name="title">
          <Select placeholder="Select title" allowClear>
            <Select.Option value="Mr.">Mr.</Select.Option>
            <Select.Option value="Ms.">Ms.</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="Designation" name="designation">
          <Input placeholder="Enter designation" />
        </Form.Item>

        <Form.Item
          label="Mobile"
          name="mobile"
          rules={[
            { required: true, message: "Please enter mobile number" },
            {
              pattern: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
              message: "Please enter a valid phone number",
            },
          ]}
        >
          <Input placeholder="Enter mobile number (e.g., +1234567890)" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please enter email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input placeholder="Enter email" />
        </Form.Item>

        <Form.Item label="Website" name="website">
          <Input placeholder="Enter website URL" />
        </Form.Item>

        <Form.Item label="Address" name="address">
          <Input placeholder="Enter address" />
        </Form.Item>

        <Form.Item label="Address Line 2" name="address_line2">
          <Input placeholder="Enter address line 2" />
        </Form.Item>

        <Form.Item label="City" name="city">
          <Input placeholder="Enter city" />
        </Form.Item>

        <Form.Item label="Country" name="country">
          <Input placeholder="Enter country" />
        </Form.Item>

        <Form.Item label="GSTIN" name="GSTIN">
          <Input placeholder="Enter GSTIN" />
        </Form.Item>

        <Form.Item label="Code" name="code">
          <Input placeholder="Enter code" />
        </Form.Item>

        <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>
          Lead Information
        </Title>

        <Form.Item label="Since Date" name="since">
          <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item
          label="Stage"
          name="stage"
          rules={[{ required: true, message: "Please select stage" }]}
        >
          <Select placeholder="Select stage" options={StageEnum} />
        </Form.Item>

        <Form.Item
          label="Source"
          name="source_id"
          rules={[{ required: true, message: "Please select source" }]}
        >
          <Select
            {...sourceSelectProps}
            placeholder="Select source"
            dropdownRender={(menu) => (
              <>
                {menu}
                <div style={{ padding: "8px", borderTop: "1px solid #f0f0f0" }}>
                  {!showNewSourceInput ? (
                    <Button
                      type="text"
                      icon={<PlusOutlined />}
                      onClick={() => setShowNewSourceInput(true)}
                      style={{ width: "100%" }}
                    >
                      Add new source
                    </Button>
                  ) : (
                    <Space style={{ width: "100%" }}>
                      <Input
                        placeholder="Source name"
                        value={newSourceName}
                        onChange={(e) => setNewSourceName(e.target.value)}
                        onPressEnter={handleCreateSource}
                        style={{ flex: 1 }}
                      />
                      <Button
                        type="primary"
                        onClick={handleCreateSource}
                        loading={isCreatingSource}
                        disabled={!newSourceName.trim()}
                      >
                        Add
                      </Button>
                      <Button
                        onClick={() => {
                          setShowNewSourceInput(false);
                          setNewSourceName("");
                        }}
                      >
                        Cancel
                      </Button>
                    </Space>
                  )}
                </div>
              </>
            )}
          />
        </Form.Item>

        <Form.Item
          label="Product"
          name="product_id"
          rules={[{ required: true, message: "Please select product" }]}
        >
          <Select
            {...productSelectProps}
            placeholder="Select product"
            dropdownRender={(menu) => (
              <>
                {menu}
                <div style={{ padding: "8px", borderTop: "1px solid #f0f0f0" }}>
                  {!showNewProductInput ? (
                    <Button
                      type="text"
                      icon={<PlusOutlined />}
                      onClick={() => setShowNewProductInput(true)}
                      style={{ width: "100%" }}
                    >
                      Add new product
                    </Button>
                  ) : (
                    <Space style={{ width: "100%" }}>
                      <Input
                        placeholder="Product name"
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        onPressEnter={handleCreateProduct}
                        style={{ flex: 1 }}
                      />
                      <Button
                        type="primary"
                        onClick={handleCreateProduct}
                        loading={isCreatingProduct}
                        disabled={!newProductName.trim()}
                      >
                        Add
                      </Button>
                      <Button
                        onClick={() => {
                          setShowNewProductInput(false);
                          setNewProductName("");
                        }}
                      >
                        Cancel
                      </Button>
                    </Space>
                  )}
                </div>
              </>
            )}
          />
        </Form.Item>

        <Form.Item label="Potential" name="potential">
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Enter potential value"
            min={0}
            precision={2}
          />
        </Form.Item>

        <Form.Item label="Tags" name="tags">
          <Select
            mode="tags"
            placeholder="Add tags"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item label="Requirements" name="requirements">
          <TextArea rows={3} placeholder="Enter requirements" />
        </Form.Item>

        <Form.Item label="Notes" name="notes">
          <TextArea rows={3} placeholder="Enter notes" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
