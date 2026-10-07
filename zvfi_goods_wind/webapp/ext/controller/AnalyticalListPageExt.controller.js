

sap.ui.controller("zvfigoodswind.ext.controller.AnalyticalListPageExt", {
    onInit: function () {
        jQuery.sap.declare("zvfigoodswind.utils.Formatter");
    },
    onBeforeContractPopoverOpens: function (e) {

    },
    setChartProperties: function () {

    },
    onPickSerials: function (oEvent) {
        var oModel = this.pickSernr.getModel("SerialModel");

        if (!oModel) {
            console.error("SerialModel not found.");
            return;
        }

        var aSerials = oModel.getProperty("/toSerials") || [];

        // Get selected ones
        var aSelectedSerials = aSerials.filter(function (oItem) {
            return oItem.Selected === true;
        });
        var sPurchaseOrder = oModel.getProperty("/PurchaseOrder");
        var sPurchaseOrderItem = oModel.getProperty("/PurchaseOrderItem");
        var sToBeRec = oModel.getProperty("/ToBeReceived");
        var sReceived = oModel.getProperty("/Received");
        if (aSelectedSerials.length > sToBeRec) {
            sap.m.MessageToast.show("That's too many serial numbers !!!");
            return;
        }
        var totalSerials = parseInt(aSelectedSerials.length);
        if (totalSerials) {
            oModel.setProperty("/Received", totalSerials);
            this.oSerialBtn.setProperty("type", "Success");
            if (totalSerials === 0) {
                this.oSerialBtn.setProperty("type", "Negative");
            }

            this.oSerialModel.setProperty(this.oSerialPath + "/Received", totalSerials);
            this.flagTargetQtyChange = "true";
            this.Enableflag = "true";
            this._enableSaveOnRenew();
        }

        var oSernrPayload = {
            PurchaseOrder: sPurchaseOrder,
            PurchaseOrderItem: sPurchaseOrderItem,
            ToBeReceived: sToBeRec,
            Received: sReceived,
            toSerials: aSerials
        }

        this.SerialArray = this.SerialArray.filter(function (entry) {
            return !(entry.PurchaseOrder === sPurchaseOrder && entry.PurchaseOrderItem === sPurchaseOrderItem);
        });
        this.SerialArray.push(oSernrPayload);
        // Do something with the selected items
        //  console.log("Selected Serials:", aSelectedSerials);

        // Example: close dialog and pass data elsewhere
        this.pickSernr.close();
        // e.g., store in view model or send to backend
    },
    onPickSernr: function (oEvent) {
        var oButton = oEvent.getSource();
        this.oSerialBtn = oEvent.getSource();

        this.oSerialModel = oButton.getBindingContext("postGrModel").getModel();
        this.oSerialPath = oButton.getBindingContext("postGrModel").getPath();
        if (oEvent.getSource().getProperty("type") === "Success" || oEvent.getSource().getProperty("type") === "Negative") {

            // Get the binding context of the row (where the button was clicked)
            var oContext = oButton.getBindingContext("postGrModel");

            if (oContext) {
                var oData = oContext.getObject(); // Get the row data as JSON object

                // Access individual properties
                var sSerialNumber = oData.SerialNumber;
                var sPurchaseOrder = oData.document;
                var sPurchaseOrderItem = oData.documentitm;
                var sMaterial = oData.Material;
                var sMaterialName = oData.MaterialName;
                var sToBeRec = parseInt(oData.ToBeReceived, 10);
                var sReceived = parseInt(oData.Received, 10);
            }
            if (!this.pickSernr) {
                var oView = this.getView();
                  this._SernrUuid = this.uuidv4();
                  this.pickSernr  = sap.ui.xmlfragment(  
                   oView.createId(this._SernrUuid),                        // <<< IMPORTANT
                   "zvfigoodswind.ext.fragment.SerialNumberPick",// fragment name
                   this                                     // controller
            );
            }

            var oModel = this.getOwnerComponent().getModel("Sernr");
            const entry = this.getSerialData(sPurchaseOrder, sPurchaseOrderItem);

            if (entry) {
                console.log("Selected Serials:", entry.toSerials.filter(s => s.Selected));
                if (this.pickSernr) {
                    var oSerials = {
                        PurchaseOrder: sPurchaseOrder,
                        PurchaseOrderItem: sPurchaseOrderItem,
                        Material: sMaterial,
                        MaterialName: sMaterialName,
                        ToBeReceived: sToBeRec,
                        Received: sReceived,
                        toSerials: JSON.parse(JSON.stringify(entry.toSerials))
                    }
                    var oFragmentModel = new sap.ui.model.json.JSONModel(oSerials);
                    this.pickSernr.setModel(oFragmentModel, "SerialModel"); // Set new model to fragment
                    this.pickSernr.getModel("SerialModel").refresh();
                    this.getView().addDependent(this.pickSernr);
                    this.pickSernr.modelReset = true;
                    this._originalSerialData = JSON.parse(JSON.stringify(oSerials));
                    this.pickSernr.open();
                    this._enableSaveOnRenew();
                }
            }
            else {
                // Get the OData model from manifest
                var sPath = "/ZVFI_CV_E_LO_W_OUTB_SERNR";
                var that = this;
                var oFilters = [
                    new sap.ui.model.Filter("DeliveryDocument", sap.ui.model.FilterOperator.EQ, sPurchaseOrder), //,
                    new sap.ui.model.Filter("DeliveryDocumentItem", sap.ui.model.FilterOperator.EQ, sPurchaseOrderItem)
                ];
                oModel.read(sPath, {

                    filters: oFilters,
                    success: function (oData) {

                        // Get the fragment instance

                        if (this.pickSernr) {
                            var oSerials = {
                                PurchaseOrder: sPurchaseOrder,
                                PurchaseOrderItem: sPurchaseOrderItem,
                                Material: sMaterial,
                                MaterialName: sMaterialName,
                                ToBeReceived: sToBeRec,
                                Received: sReceived,
                                toSerials: oData.results
                            }
                            var oFragmentModel = new sap.ui.model.json.JSONModel(oSerials);
                            this.pickSernr.setModel(oFragmentModel, "SerialModel"); // Set new model to fragment
                            this.pickSernr.getModel("SerialModel").refresh();
                            this.getView().addDependent(this.pickSernr);
                            this.pickSernr.modelReset = true;
                            this._originalSerialData = JSON.parse(JSON.stringify(oSerials));
                            this.pickSernr.open();
                            this._enableSaveOnRenew();
                        }
                    }.bind(this),
                    error: function (oError) {
                        if (this.pickSernr) {
                            var oSerials = {
                                PurchaseOrder: sPurchaseOrder,
                                PurchaseOrderItem: sPurchaseOrderItem,
                                Material: sMaterial,
                                MaterialName: sMaterialName,
                                ToBeReceived: sToBeRec,
                                Received: sReceived,
                                toSerials: {}
                            }
                            var oFragmentModel = new sap.ui.model.json.JSONModel(oSerials);
                            this.pickSernr.setModel(oFragmentModel, "SerialModel"); // Set new model to fragment
                            this.pickSernr.getModel("SerialModel").refresh();
                            this.getView().addDependent(this.pickSernr);
                            this.pickSernr.modelReset = true;
                            this._originalSerialData = JSON.parse(JSON.stringify(oSerials));
                            this.pickSernr.open();
                            this._enableSaveOnRenew();
                        }
                    }
                });
            }
        }
    },
    onDeleteSerial: function (oEvent) {
        var oButton = oEvent.getSource();
        var oItem = oButton.getParent(); // ColumnListItem
        var oCtx = oItem.getBindingContext("SerialModel");

        if (!oCtx) {
            console.warn("No context found for deletion.");
            return;
        }

        var sPath = oCtx.getPath(); // e.g., "/toSerials/2"
        var oModel = oCtx.getModel();
        var aData = oModel.getProperty("/toSerials");

        var iIndex = parseInt(sPath.split("/").pop());
        if (!isNaN(iIndex)) {
            aData.splice(iIndex, 1);
            oModel.setProperty("/toSerials", aData);
        }
    },
    onPressManSerialAdd: function (oEvent) {

        // Optional: stop default behavior
        if (oEvent && typeof oEvent.preventDefault === "function") {
            oEvent.preventDefault();
        }
        
        var oView = this.pickSernr;

        // Get the SerialModel
        var oModel = oView.getModel("SerialModel");

        // Get current serials array
        var aSerials = oModel.getProperty("/toSerials");
        var oManId = this.getView().createId(this._SernrUuid + "--SerialManualInput");
         
        // Get the value from the input field
        var oInput = this.byId(oManId);
        var sNewSerial = oInput.getValue().trim();

        if (!sNewSerial) {
            sap.m.MessageToast.show("Please enter a serial number.");
            return;
        }

        // Check for duplicates (optional)
        var bExists = aSerials.some(function (oItem) {
            return oItem.SerialNumber === sNewSerial;
        });
        if (bExists) {
            sap.m.MessageToast.show("Serial number already exists.");
            return;
        }

        // Create a new entry and add it
        var oNewSerial = {
            SerialNumber: sNewSerial,
            Selected: true
        };

        aSerials.push(oNewSerial);

        // Update the model
        oModel.setProperty("/toSerials", aSerials);

        // Clear the input field
        this.byId(oManId).setValue("");
    },
    readAsync: function (oModel, sPath) {
        return new Promise(function (resolve, reject) {
            oModel.read(sPath, {
                success: resolve,
                error: reject
            });
        });
    },
    getSerialData: function (sPurchaseOrder, sPurchaseOrderItem) {
        return this.SerialArray.find(item =>
            item.PurchaseOrder === sPurchaseOrder &&
            item.PurchaseOrderItem === sPurchaseOrderItem
        );
    },
     uuidv4() {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
            (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
        );
    },
    onPostGr: async function (e) {
        this.getView().setBusy(true);
        this.SerialArray = [];
        const aContexts = this.extensionAPI.getSelectedContexts();
        const postItems = [];

        for (let i = 0; i < aContexts.length; i++) {
            const element = aContexts[i];
            const oModel = element.getModel();
            const sPath = element.getPath();

            // If data not present, fetch it from backend
            let data = {};
            try {
                data = await this.readAsync(oModel, sPath);
            } catch (err) {
                console.error("Read failed for path: ", sPath, err);
                continue; // skip this item
            }


            // Modify your data
            data.SernrV = data.Serialized === "Success" || data.Serialized === "Negative";

            postItems.push(data);
        }

        this.getView().setBusy(false);
        this.flagDate = "true";
        this.flagTargetAmt = "true";
        this.flagTargetQtyChange = "true";
        if (!this._oRenewContractDialog) {

            var oView = this.getView();
  
            this._PostUuid = this.uuidv4();
            this._oRenewContractDialog = sap.ui.xmlfragment(
                oView.createId(this._PostUuid),                        // <<< IMPORTANT
              "zvfigoodswind.ext.fragment.PostGoodsReceipt",// fragment name
                this                                     // controller
            );
            oView.addDependent(this._oRenewContractDialog);

        }

        var oData = {
            PostingDate: new Date(),
            Plant: postItems[0].Plant,
            PlantName: postItems[0].PlantName,
            to_MaterialDocumentItem: postItems
        };
        var oModel = new sap.ui.model.json.JSONModel(oData);
        this._oRenewContractDialog.setModel(oModel, "postGrModel");

        this.getView().addDependent(this._oRenewContractDialog);
        this._oRenewContractDialog.modelReset = true;
        this._oRenewContractDialog.open();
        this._enableSaveOnRenew();
    },
    onBeforeOpenF: function (oEvent) {

    },
    onTableUpdateFinished: function () {
        if (this._oRenewContractDialog.modelReset) {
            this._oRenewContractDialogModel = $.extend(true, {}, this._oRenewContractDialog.getModel());
            this._oRenewContractDialog.modelReset = false;
        }

    },
    getSerialResults: function (oPath, oModel, oFilters) {
        return new Promise(function (resolve, reject) {
            oModel.read(oPath, {
                filters: oFilters,
                success: function (oData) {
                    resolve(oData);
                },
                error: function (oError) {
                    reject(oError);
                }
            });

        });
    },
    onPressPost: async function (oEvent) {
        this._oRenewContractDialog.setBusy(true);
        this.getView().setBusy(true);
        this.logMess = [];
        var oModel = this._oRenewContractDialog.getModel("postGrModel");
        var oData = oModel.getData();
        // Prepare your payload
        // var GrItems = new Array();
        var to_Items = {};
        var doctype = "";
        var refdoc = "";
        var oFilters = [];

        const oSernrModel = this.getOwnerComponent().getModel("Sernr");
        const GrItems = [];
        this.ZREBitm = [];
        //oData.to_MaterialDocumentItem.forEach( async (item) => {
        for (const item of oData.to_MaterialDocumentItem) {
            // 1) Create a fresh object per iteration
            const to_Items = {
                Material: item.Material,
                Plant: item.Plant,
                StorageLocation: item.StorageLocation,
                GoodsMovementType: item.doctype === "Inbound Deliv." ? "109" : "101",
                //Supplier: item.Supplier,
                InventoryValuationType: item.ValuationType,
                PurchaseOrder: item.PurchaseOrder,
                PurchaseOrderItem: item.PurchaseOrderItem,
                GoodsMovementRefDocType: "B",
                GoodsMovementReasonCode: "0",
                EntryUnit: item.BaseUnit,
                QuantityInEntryUnit: item.Received.toString(),
                SerialNumbersAreCreatedAutomly: false,
                to_SerialNumbers: []
            };
            doctype = item.doctype;
            if (oData.DelivNote) {
                refdoc = oData.DelivNote;
            }
            if (item.doctype === "Outbound Deliv." || item.doctype === "Inbound Deliv.") {
                refdoc = item.document;
                if (oData.DelivNote) {
                    refdoc = oData.DelivNote;
                }
                if (refdoc === "") {
                    refdoc = item.document;
                }
                if (item.doctype === "Inbound Deliv.") {
                    to_Items.GoodsMovementType = item.GoodsMovementType;
                }
                to_Items.Delivery = item.document;
                to_Items.DeliveryItem = item.documentitm;
            }
            // Get the serial numbers
            const oSernrs = this.getSerialData(item.document, item.documentitm);
            if (oSernrs) {
                const aSelectedSerials = oSernrs.toSerials.filter(function (oItem) {
                    return oItem.Selected === true;
                });
                aSelectedSerials.forEach((serialItem) => {
                    to_Items.to_SerialNumbers.push({
                        SerialNumber: serialItem.SerialNumber
                    });
                });
            }

            if (item.doctype === "Outbound Deliv." && item.PurchaseOrder === '') {
                this.ZREBitm.push(to_Items);
            }
            else {
                GrItems.push(to_Items);
            }
        }


        var oPayload = {
            PostingDate: "",
            DocumentDate:"",
            ReferenceDocument: refdoc,
            MaterialDocumentHeaderText: "Via Fiori GR App",
            GoodsMovementCode: "01",
            to_MaterialDocumentItem: GrItems
        };
        if (doctype === "Outbound Deliv.") {
            oPayload = {
                VersionForPrintingSlip: "1",
                ReferenceDocument: refdoc,
                PostingDate: "",
                MaterialDocumentHeaderText: "Via Fiori GR App",
                GoodsMovementCode: "01",
                to_MaterialDocumentItem: GrItems
            };
        }
        var postDate = new Date(oData.PostingDate.toString());
        var formattedDate = new Intl.DateTimeFormat('sv-SE', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(postDate) + "T00:00:00";
        oPayload.DocumentDate = formattedDate;
        var currentDate = new Date();

      formattedDate = new Intl.DateTimeFormat('sv-SE', {
         year: 'numeric',
         month: '2-digit',
         day: '2-digit'
       }).format(currentDate) + "T00:00:00";
       oPayload.PostingDate = formattedDate;
        // Initialize the OData Model
        var oGoodsModel = this.getView().getModel("GoodsIssue");
        var oMatModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/SAP/API_MATERIAL_DOCUMENT_SRV/", {
            //  useBatch: true,
            defaultUpdateMethod: "POST"
        });

        // Define the request for the Material Document Header with filters
        var sReadRequest = "/A_MaterialDocumentHeader?$expand=to_MaterialDocumentItem";


        var sToken = oMatModel.getSecurityToken();
        sReadRequest = "/A_MaterialDocumentHeader";
        var sGroupId = "materialPostBatch";

        if (GrItems.length > 0) {
            // Start busy state
            this.getView().setBusy(true);
            this._oRenewContractDialog.setBusy(true);

            try {

                oMatModel.create(sReadRequest, oPayload, {
                    success: (oData) => {
                        this.getView().setBusy(false);
                        this._oRenewContractDialog.setBusy(false);

                        console.log("Create successful:", oData);

                        let sSuccessMsg = "Material Document Posted Successfully";
                        if (oData && oData.MaterialDocument) {
                            sSuccessMsg = "Material Document " + oData.MaterialDocument + " Posted Successfully";
                        }

                        this._handlePostResult(oData, "Success", sSuccessMsg);
                        this._openPostResult(oData, "Success", sSuccessMsg);
                    },

                    error: (oError) => {
                        this.getView().setBusy(false);
                        this._oRenewContractDialog.setBusy(false);

                        console.error("Create failed:", oError);

                        const sErrorMsg = "Error Posting Material Document";

                        this._handlePostResult(oError, "Error", sErrorMsg);
                        this._openPostResult(oError, "Error", sErrorMsg);
                    }
                });

            } catch (oError) {

                // Synchronous or unexpected JS errors
                this.getView().setBusy(false);
                this._oRenewContractDialog.setBusy(false);

                console.error("Unexpected exception:", oError);

                const sFatalMsg = "Technical Error: " + oError.message;

                this._openPostResult(
                    [{ message: oError.message }],
                    "Error",
                    sFatalMsg
                );
            }
        } else {
            this.onZREBpost(oEvent, oGoodsModel);
        }
    },

    onZREBpost: function (oEvent, oGoodsModel) {
        const oMessageManager = sap.ui.getCore().getMessageManager();

        this.ZREBitm.forEach((to_Items) => {
            var sEntityKey =
                "GoodsIssue(OutboundDelivery='" + to_Items.Delivery +
                "',OutboundDeliveryItem='" + to_Items.DeliveryItem +
                "',ActualDeliveryQuantity='" + to_Items.QuantityInEntryUnit +
                "')/com.sap.gateway.srvd.zvfi_sd_e_lo_w_goodsissue.v0001.post(...)";

            // Bind context for the entity instance
            var oContext = oGoodsModel.bindContext("/" + sEntityKey, undefined, {
                $$updateGroupId: "actionGroup"
            });

            oContext.execute()
                .then(() => {
                    const aMessages = oMessageManager.getMessageModel().getData();
                    const aErrors = aMessages.filter((msg) => msg.type === "Error");

                    oMessageManager.removeAllMessages();

                    if (aErrors.length > 0) {
                        // Backend / business errors
                        this.logMess.push({
                            type: aErrors[0].type,
                            text: aErrors[0].message
                        });


                        this._openPostResult(
                            aErrors,
                            "Error",
                            aErrors[0].message
                        );
                    } else {
                        // Success
                        this.logMess.push({
                            type: "Success",
                            text: "Material Document Posted Successfully"
                        });
                        this._openPostResult(
                            [],
                            "Success",
                            "Material Document Posted Successfully"
                        );
                    }
                })
                .catch((oError) => {
                    // Technical errors only (network, 500, etc.)
                    this._openPostResult(
                        [{ message: oError.message }],
                        "Error",
                        "Technical Error: " + oError.message
                    );
                });
        });
    },
    onPressRec: function (e) {
        if (!this._oRenewContractDialog) {
            sap.m.MessageToast.show("Dialog not found. Contact IT");
            return;
        }
        this._oRenewContractDialog.setBusy(true);
        this.getView().setBusy(true);
        var oModel = this._oRenewContractDialog.getModel("postGrModel");
        var oData = oModel.getData();
        const oSernrModel = this.getOwnerComponent().getModel("Sernr");
        const promises = oData.to_MaterialDocumentItem.map(async (item) => {
            const sPath = "/ZVFI_CV_E_LO_W_OUTB_SERNR";
            const oFilters = [
                new sap.ui.model.Filter("DeliveryDocument", sap.ui.model.FilterOperator.EQ, item.document),
                new sap.ui.model.Filter("DeliveryDocumentItem", sap.ui.model.FilterOperator.EQ, item.documentitm)
            ];

            if (item.SernrV) {
                const oCoItems = await this.getSerialResults(sPath, oSernrModel, oFilters);

                if (oCoItems && oCoItems.results.length && oCoItems.results.length === parseInt(item.ToBeReceived, 10)) {
                    oCoItems.results.forEach(item => {
                        item.Selected = true;
                    });
                    var oSernrPayload = {
                        PurchaseOrder: item.document,
                        PurchaseOrderItem: item.documentitm,
                        ToBeReceived: item.ToBeReceived,
                        Received: item.Received,
                        toSerials: oCoItems.results
                    }
                    this.SerialArray.push(oSernrPayload);
                    item.Serialized = "Success";
                }
            }

            item.Received = item.ToBeReceived;
        });

        // Wait for all async iterations to complete
        Promise.all(promises).then(() => {
            oModel.setData(oData); // Set the data after all async work is done
            oModel.setData(oData);
            oModel.refresh(true);
            this.Enableflag = "true";
            this._enableSaveOnRenew();
            this._oRenewContractDialog.setBusy(false);
            this.getView().setBusy(false);
        });


        // this._oRenewContractDialog.close();
    },

    formatSernrKeys: function (purchaseOrder, purchaseOrderItem) {
        return purchaseOrder + " - " + purchaseOrderItem + "  ";
    },

    fnUpdateSuccess: function (d, r) {
        this.getView().getModel().refresh();

    },
    fnUpdateError: function (m) {
        sap.m.MessageToast.show(m.message);
    },
    onPostCancel: function (e) {
        this.logMess = [];
        this.ZREBitm = [];
        this.SerialArray = [];
        this._originalSerialData = {};
        this._oRenewContractDialog.getModel().resetChanges();

        this._oRenewContractDialog.close();
        this.getView().setBusy(false);

    },

    onPickCancel: function (e) {
        if (this._originalSerialData) {
            const oResetModel = new sap.ui.model.json.JSONModel(this._originalSerialData);
            // this.pickSernr.setModel("SerialModel" ,oResetModel);
            this.pickSernr.setModel(oResetModel, "SerialModel");
            this.pickSernr.getModel("SerialModel").refresh();
            this.pickSernr.modelReset = true;
        }

        this.pickSernr.close();
    },
    onBeforeRebindTableExtension: function (e) {

    },
    _openPostResult: function (oResponse, sDefaultType, sDefaultText) {
        // Load fragment if not already loaded
        if (!this.logMessages) {
            var oView = this.getView();
             this.logMessagesUuid = this.uuidv4();
             this.logMessages = sap.ui.xmlfragment(
                oView.createId(this.logMessagesUuid),                        // <<< IMPORTANT
              "zvfigoodswind.ext.fragment.MessageLogs",// fragment name
                this                                     // controller
            );
            this.getView().addDependent(this.logMessages);
        }

        // Set the message model
        var oMessageModel = new sap.ui.model.json.JSONModel({ messages: this.logMess });
        this.logMessages.setModel(oMessageModel, "messageModel");
        this.oRespType = sDefaultType;
        // Refresh the model to update UI
        this.logMessages.getModel("messageModel").refresh(true);

        // Open the message dialog
        this.logMessages.open();
    },
    _handlePostResult: function (oResponse, sDefaultType, sDefaultText) {
        this.logMess = [];
        var alogMess = [];
        try {
            if (oResponse && oResponse.headers && oResponse.headers["sap-message"]) {
                var oMessage = JSON.parse(oResponse.headers["sap-message"]);
                alogMess.push({
                    type: oMessage.severity || "Information",
                    text: oMessage.message
                });

                if (oMessage.details) {
                    oMessage.details.forEach(function (detail) {
                        alogMess.push({
                            type: detail.severity || "Information",
                            text: detail.message
                        });
                    });
                }
            } else if (oResponse.responseText) {
                var oErrorResponse = JSON.parse(oResponse.responseText);
                if (oErrorResponse.error && oErrorResponse.error.innererror && oErrorResponse.error.innererror.errordetails) {
                    oErrorResponse.error.innererror.errordetails.forEach(function (detail) {
                        alogMess.push({
                            type: "Error",
                            text: detail.message
                        });
                    });
                } else {
                    alogMess.push({
                        type: sDefaultType,
                        text: sDefaultText
                    });
                }
            }
            else if (oResponse.MaterialDocument) {
                alogMess.push({
                    type: sDefaultType,
                    text: sDefaultText
                });
            }
            else {
                alogMess.push({
                    type: sDefaultType,
                    text: sDefaultText
                });
            }
        } catch (e) {
            alogMess.push({
                type: "Error",
                text: "Unknown error occurred"
            });
        }
        this.logMess = alogMess;

    },
    _attachSelectionChange: function (e) {
        if (e.getSource().getSelectedIndices().length !== 0) {
            e.getSource().getParent().getParent().getCustomToolbar().getContent()[2].setEnabled(true);
            var s;
            if (e.getSource().getSelectedIndex() !== -1) {
                s = e.getSource().getParent().getContextByIndex(e.getSource().getSelectedIndex()).getObject();
            } else {
                s = e.getSource().getParent().getContextByIndex(e.getSource().getSelectedIndices()[0]).getObject();
            }
            this.PurchaseContract = s.PurchaseContract;
            this.PurchaseContractItem = s.PurchaseContractItem;
        } else {
            e.getSource().getParent().getParent().getCustomToolbar().getContent()[2].setEnabled(false);
        }
    },
    onValidityLinkPress: function (e) {

    },
    onClose: function (e) {
        e.getSource().destroy();
    },
    onTargetAmtChange: function (e) {

        this.Enableflag = "true";
        e.getSource().setValueState("None");
        e.getSource().setValueStateText("");
        this.flagTargetAmt = "true";
        this._enableSaveOnRenew();

    },
    onTargetQtyChange: function (e) {
        this.oSerialModel = e.getSource().getBindingContext("postGrModel").getModel();
        this.oSerialPath = e.getSource().getBindingContext("postGrModel").getPath();
        var sPurchaseOrder = this.oSerialModel.getProperty(this.oSerialPath + "/PurchaseOrder");

        var sPurchaseOrderItem = this.oSerialModel.getProperty(this.oSerialPath + "/PurchaseOrderItem");
        if (this.oSerialModel.getProperty(this.oSerialPath + "/Serialized") === "Negative"
            || this.oSerialModel.getProperty(this.oSerialPath + "/Serialized") === "Success") {
            var serialItemL = 0;
            if (this.getSerialData(sPurchaseOrder, sPurchaseOrderItem)) {
                serialItemL = this.getSerialData(sPurchaseOrder, sPurchaseOrderItem).length;
            }
            if (this.oSerialModel.getProperty(this.oSerialPath + "/Received") === serialItemL && serialItemL < 0) {
                this.oSerialModel.setProperty(this.oSerialPath + "/Serialized", "Success");
            }
            else {
                this.oSerialModel.setProperty(this.oSerialPath + "/Serialized", "Negative");
            }
        }
        e.getSource().setValueState("None");
        e.getSource().setValueStateText("");
        this.flagTargetQtyChange = "true";
        this.Enableflag = "true";
        this._enableSaveOnRenew();

    },
    onValidityEndDateChanged: function (e) {
        var f;
        if (e.getParameter("valid")) {
            e.getSource().setValueState("None");
            e.getSource().setValueStateText("");
            this.flagDate = "true";
            this.Enableflag = "true";
            this._enableSaveOnRenew();

        } else {
            e.getSource().setValueState("Error");
            e.getSource().setValueStateText(this.getView().getModel("@i18n").getProperty("EnterValidEndDate"));
            this.flagDate = "false";
            this._enableSaveOnRenew();
        }
        return (f);
    },
    _enableSaveOnRenew: function () {
        if ((this.flagTargetAmt === "true") && (this.Enableflag === "true") && (this.flagTargetQtyChange === "true") && (this.flagDate === "true")) {
            this._oRenewContractDialog.getBeginButton().setEnabled(true);
        } else {
            this._oRenewContractDialog.getBeginButton().setEnabled(false);
        }
    },

    onCloseMessageDialog: function (oEvent) {
        if (this.oRespType === "Error") {
            this._oRenewContractDialog.setBusy(false);
            this.getView().setBusy(false);
            oEvent.getSource().getParent().close();

        } else {
            this._oRenewContractDialog.setBusy(false);
            this.getView().setBusy(false);
            this.ZREBitm = [];
            this.SerialArray = [];
            this._originalSerialData = {};
            oEvent.getSource().getParent().close();
            this._oRenewContractDialog.close();
            this.extensionAPI.refreshTable();
        }
    },
    onExit: function () {
    if (this._oRenewContractDialog) {
        this._oRenewContractDialog.destroy();
     
    }
    if (this.pickSernr) {
        this.pickSernr.destroy();
   
    }
    if (this.logMessages) {
        this.logMessages.destroy();
       
    }
}


});